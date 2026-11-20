@extends('layout')
@section('titulo', 'Veículo')
@section('conteudo')
    <h1>{{ $veiculo->exists ? 'Editar veículo ' . $veiculo->plate : 'Cadastrar veículo' }}</h1>
    <p class="muted">Cliente: {{ $cliente->name }}</p>
    <form method="POST" class="form card"
          action="{{ $veiculo->exists ? route('veiculos.update', $veiculo) : route('veiculos.store', $cliente) }}">
        @csrf
        @if ($veiculo->exists) @method('PUT') @endif
        <div class="linha">
            <label>Placa
                <input name="plate" value="{{ old('plate', $veiculo->plate) }}" required placeholder="ABC1D23">
                @error('plate') <span class="erro-campo">{{ $message }}</span> @enderror
            </label>
            <label>Ano
                <input type="number" name="year" value="{{ old('year', $veiculo->year) }}" required>
                @error('year') <span class="erro-campo">{{ $message }}</span> @enderror
            </label>
        </div>
        <div class="linha">
            <label>Marca
                <input name="brand" value="{{ old('brand', $veiculo->brand) }}" required>
                @error('brand') <span class="erro-campo">{{ $message }}</span> @enderror
            </label>
            <label>Modelo
                <input name="model" value="{{ old('model', $veiculo->model) }}" required>
                @error('model') <span class="erro-campo">{{ $message }}</span> @enderror
            </label>
        </div>
        <div class="acoes">
            <button class="botao primario" type="submit">Salvar</button>
            <a class="botao" href="{{ route('clientes.show', $cliente) }}">Voltar</a>
        </div>
    </form>
@endsection
