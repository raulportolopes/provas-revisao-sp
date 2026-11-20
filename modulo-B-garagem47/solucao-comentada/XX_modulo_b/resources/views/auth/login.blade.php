@extends('layout')
@section('titulo', 'Entrar')
@section('conteudo')
    <div class="card login">
        <h1>Entrar</h1>
        <form method="POST" action="{{ route('login.entrar') }}" class="form">
            @csrf
            <label>E-mail
                {{-- old('email') devolve o que foi digitado quando a validação falha --}}
                <input type="email" name="email" value="{{ old('email') }}" required autofocus autocomplete="username">
            </label>
            <label>Senha
                <input type="password" name="password" required autocomplete="current-password">
            </label>
            <button class="botao primario" type="submit">Entrar</button>
        </form>
    </div>
@endsection
