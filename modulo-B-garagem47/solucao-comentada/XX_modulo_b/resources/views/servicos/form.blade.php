@extends('layout')
@section('titulo', 'Serviço')
@section('conteudo')
    <h1>{{ $servico->exists ? 'Editar serviço' : 'Cadastrar serviço' }}</h1>
    <form method="POST" class="form card"
          action="{{ $servico->exists ? route('servicos.update', $servico) : route('servicos.store') }}">
        @csrf
        @if ($servico->exists) @method('PUT') @endif
        <label>Nome
            <input name="name" value="{{ old('name', $servico->name) }}" required maxlength="80">
            @error('name') <span class="erro-campo">{{ $message }}</span> @enderror
        </label>
        <label>Preço (R$)
            {{-- aceita 1.234,56 ou 1234.56: o ServiceRequest converte antes de validar --}}
            <input name="price" inputmode="decimal" value="{{ old('price', $servico->exists ? number_format($servico->price, 2, ',', '.') : '') }}" required>
            @error('price') <span class="erro-campo">{{ $message }}</span> @enderror
        </label>
        {{-- checkbox: old('active') é null quando desmarcado; por isso o teste com $errors->any() --}}
        <label class="inline">
            <input type="checkbox" name="active" value="1" @checked($errors->any() ? old('active') : $servico->active)> Ativo
        </label>
        <div class="acoes">
            <button class="botao primario" type="submit">Salvar</button>
            <a class="botao" href="{{ route('servicos.index') }}">Voltar</a>
        </div>
    </form>
@endsection
