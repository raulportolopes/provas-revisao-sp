@extends('layout')
@section('titulo', 'Apagar aluno')
@section('conteudo')
    <div class="card">
        <h1>Apagar o aluno {{ $aluno->name }}?</h1>
        <p>Alunos com matrículas registradas não podem ser apagados.</p>
        <form method="POST" action="{{ route('alunos.destroy', $aluno) }}" class="acoes">
            @csrf @method('DELETE')
            <button class="botao perigo" type="submit">Confirmar exclusão</button>
            <a class="botao" href="{{ route('alunos.show', $aluno) }}">Cancelar</a>
        </form>
    </div>
@endsection
