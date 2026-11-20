<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate(['email' => 'required|email', 'password' => 'required|string']);
        $user = User::where('email', $request->email)->first();
        if (! $user || ! Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'E-mail ou senha inválidos.'], 401);
        }
        return ['token' => $user->createToken('api')->plainTextToken, 'user' => $this->dados($user)];
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->noContent();
    }

    public function me(Request $request) { return $this->dados($request->user()); }

    private function dados(User $u): array { return ['id' => $u->id, 'name' => $u->name, 'email' => $u->email, 'role' => $u->role]; }
}
