<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BloodType;
use App\Models\Donor;
use App\Models\User;
use App\Rules\Cpf;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /** POST /api/register – cadastro do doador (já devolve o token). */
    public function register(Request $request)
    {
        // normaliza o CPF ANTES de validar o unique (no banco ele fica só com números)
        $request->merge(['cpf' => preg_replace('/\D/', '', (string) $request->input('cpf'))]);

        $dados = $request->validate([
            'name' => ['required', 'string', 'min:3', 'max:150'],
            'cpf' => ['required', new Cpf, 'unique:donors,cpf'],
            'email' => ['required', 'email', 'max:255', 'unique:donors,email'],
            'password' => ['required', 'string', 'min:8', 'regex:/[A-Za-z]/', 'regex:/\d/'],
            'birth_date' => ['required', 'date_format:Y-m-d', 'before:today'],
            'sex' => ['required', Rule::in(['M', 'F'])],
            'weight_kg' => ['required', 'numeric', 'between:30,300'],
            'blood_type' => ['nullable', Rule::exists('blood_types', 'code')],
        ], [
            'password.regex' => 'A senha precisa ter letras e números.',
            'cpf.unique' => 'CPF já cadastrado.',
            'email.unique' => 'E-mail já cadastrado.',
        ]);

        // regra de negócio que depende de outro campo: idade mínima no cadastro
        if (Carbon::parse($dados['birth_date'])->diffInYears(today()) < 16) {
            throw ValidationException::withMessages(['birth_date' => 'É preciso ter pelo menos 16 anos.']);
        }

        $donor = Donor::create([
            ...collect($dados)->except('blood_type')->all(),
            'blood_type_id' => isset($dados['blood_type']) ? BloodType::where('code', $dados['blood_type'])->value('id') : null,
        ]);
        $token = $donor->createToken('app', ['donor'])->plainTextToken;

        return response()->json(['token' => $token, 'donor' => ['id' => $donor->id, 'name' => $donor->name]], 201);
    }

    /** POST /api/login – doador. */
    public function login(Request $request)
    {
        $request->validate(['email' => 'required|email', 'password' => 'required|string']);
        $donor = Donor::where('email', $request->email)->first();
        if (! $donor || ! Hash::check($request->password, $donor->password)) {
            return response()->json(['message' => 'E-mail ou senha inválidos.'], 401);
        }
        return response()->json([
            'token' => $donor->createToken('app', ['donor'])->plainTextToken,
            'donor' => ['id' => $donor->id, 'name' => $donor->name],
        ]);
    }

    /** POST /api/staff/login – equipe (token com a habilidade "staff"). */
    public function staffLogin(Request $request)
    {
        $request->validate(['email' => 'required|email', 'password' => 'required|string']);
        $user = User::where('email', $request->email)->first();
        if (! $user || ! Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'E-mail ou senha inválidos.'], 401);
        }
        return response()->json([
            'token' => $user->createToken('staff', ['staff'])->plainTextToken,
            'user' => ['id' => $user->id, 'name' => $user->name, 'role' => $user->role],
        ]);
    }

    /** POST /api/logout – apaga só o token usado nesta requisição. */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->noContent(); // 204
    }
}
