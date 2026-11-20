@extends('layout')
@section('titulo', 'Aluno')
@section('conteudo')
    <h1>{{ $aluno->exists ? 'Editar aluno' : 'Cadastrar aluno' }}</h1>
    <form method="POST" class="form card" action="{{ $aluno->exists ? route('alunos.update', $aluno) : route('alunos.store') }}">
        @csrf
        @if ($aluno->exists) @method('PUT') @endif
        <label>Nome <input name="name" value="{{ old('name', $aluno->name) }}" required maxlength="100">
            @error('name')<span class="erro-campo">{{ $message }}</span>@enderror</label>
        <div class="linha">
            <label>Data de nascimento <input type="date" name="birth_date" value="{{ old('birth_date', $aluno->birth_date?->format('Y-m-d')) }}" required>
                @error('birth_date')<span class="erro-campo">{{ $message }}</span>@enderror</label>
            <label>Telefone <input name="phone" value="{{ old('phone', $aluno->phone ? Formato::telefone($aluno->phone) : '') }}" required placeholder="(15) 99999-9999">
                @error('phone')<span class="erro-campo">{{ $message }}</span>@enderror</label>
        </div>
        <label>E-mail (opcional) <input type="email" name="email" value="{{ old('email', $aluno->email) }}">
            @error('email')<span class="erro-campo">{{ $message }}</span>@enderror</label>
        <fieldset class="checks" style="grid-template-columns:1fr 1fr">
            <legend>Responsável (obrigatório para menor de 18 anos)</legend>
            <label>Nome do responsável <input name="guardian_name" value="{{ old('guardian_name', $aluno->guardian_name) }}">
                @error('guardian_name')<span class="erro-campo">{{ $message }}</span>@enderror</label>
            <label>Telefone do responsável <input name="guardian_phone" value="{{ old('guardian_phone', $aluno->guardian_phone ? Formato::telefone($aluno->guardian_phone) : '') }}">
                @error('guardian_phone')<span class="erro-campo">{{ $message }}</span>@enderror</label>
        </fieldset>
        <div class="acoes">
            <button class="botao primario" type="submit">Salvar</button>
            <a class="botao" href="{{ $aluno->exists ? route('alunos.show', $aluno) : route('alunos.index') }}">Voltar</a>
        </div>
    </form>
@endsection
