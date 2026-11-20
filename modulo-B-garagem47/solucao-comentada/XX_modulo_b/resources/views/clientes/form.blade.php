@extends('layout')
@section('titulo', $cliente->exists ? 'Editar cliente' : 'Novo cliente')
@section('conteudo')
    <h1>{{ $cliente->exists ? 'Editar cliente' : 'Cadastrar cliente' }}</h1>
    {{-- Um formulário só para criar e editar. Na edição, @method('PUT') simula o verbo PUT. --}}
    <form method="POST" class="form card"
          action="{{ $cliente->exists ? route('clientes.update', $cliente) : route('clientes.store') }}">
        @csrf
        @if ($cliente->exists) @method('PUT') @endif

        {{-- old('campo', valor do banco): depois de um erro mostra o digitado; na edição mostra o atual --}}
        <label>Nome
            <input name="name" value="{{ old('name', $cliente->name) }}" required maxlength="100">
            @error('name') <span class="erro-campo">{{ $message }}</span> @enderror
        </label>
        <div class="linha">
            <label>CPF
                <input name="cpf" value="{{ old('cpf', Formato::cpf($cliente->cpf)) }}" required placeholder="000.000.000-00">
                @error('cpf') <span class="erro-campo">{{ $message }}</span> @enderror
            </label>
            <label>Telefone
                <input name="phone" value="{{ old('phone', $cliente->phone ? Formato::telefone($cliente->phone) : '') }}" required placeholder="(15) 99999-9999">
                @error('phone') <span class="erro-campo">{{ $message }}</span> @enderror
            </label>
        </div>
        <label>E-mail (opcional)
            <input type="email" name="email" value="{{ old('email', $cliente->email) }}">
            @error('email') <span class="erro-campo">{{ $message }}</span> @enderror
        </label>
        <div class="acoes">
            <button class="botao primario" type="submit">Salvar</button>
            <a class="botao" href="{{ $cliente->exists ? route('clientes.show', $cliente) : route('clientes.index') }}">Voltar</a>
        </div>
    </form>
@endsection
