<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function form()
    {
        return view('auth.login');
    }

    public function entrar(Request $request)
    {
        $dados = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        // Confere a senha "na mão" para poder diferenciar usuário inativo de senha errada.
        // Hash::check compara a senha digitada com o hash bcrypt guardado no banco.
        $user = User::where('email', $dados['email'])->first();
        if (! $user || ! Hash::check($dados['password'], $user->password)) {
            return back()->withErrors(['email' => 'E-mail ou senha incorretos.'])->onlyInput('email');
        }
        if (! $user->active) {
            return back()->withErrors(['email' => 'Usuário inativo. Procure a coordenação.'])->onlyInput('email');
        }

        Auth::login($user);
        $request->session()->regenerate(); // evita fixação de sessão

        return redirect()->route('painel');
    }

    public function sair(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login');
    }
}
