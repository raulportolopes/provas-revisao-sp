@extends('layout')
@section('titulo', 'Apagar turma')
@section('conteudo')
    <div class="card">
        <h1>Apagar a turma {{ $turma->code }}?</h1>
        <p>Turmas com matrículas registradas (inclusive canceladas) não podem ser apagadas: desative a turma na edição.</p>
        <form method="POST" action="{{ route('turmas.destroy', $turma) }}" class="acoes">
            @csrf @method('DELETE')
            <button class="botao perigo" type="submit">Confirmar exclusão</button>
            <a class="botao" href="{{ route('turmas.show', $turma) }}">Cancelar</a>
        </form>
    </div>
@endsection
