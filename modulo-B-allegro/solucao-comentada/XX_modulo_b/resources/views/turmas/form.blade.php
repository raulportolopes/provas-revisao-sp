@extends('layout')
@section('titulo', 'Turma')
@section('conteudo')
    <h1>{{ $turma->exists ? 'Editar turma ' . $turma->code : 'Cadastrar turma' }}</h1>
    <form method="POST" class="form card" action="{{ $turma->exists ? route('turmas.update', $turma) : route('turmas.store') }}">
        @csrf
        @if ($turma->exists) @method('PUT') @endif
        <div class="linha">
            <label>Código <input name="code" value="{{ old('code', $turma->code) }}" required maxlength="20" placeholder="VIO-BAS-SEG18">
                @error('code')<span class="erro-campo">{{ $message }}</span>@enderror</label>
            <label>Nível
                <select name="level" required>
                    @foreach (\App\Models\SchoolClass::NIVEIS as $k => $n)<option value="{{ $k }}" @selected(old('level', $turma->level) === $k)>{{ $n }}</option>@endforeach
                </select></label>
        </div>
        <div class="linha">
            <label>Instrumento
                <select name="instrument_id" required><option value="">Escolha...</option>
                    @foreach ($instrumentos as $i)<option value="{{ $i->id }}" @selected((string) old('instrument_id', $turma->instrument_id) === (string) $i->id)>{{ $i->name }}</option>@endforeach
                </select>@error('instrument_id')<span class="erro-campo">{{ $message }}</span>@enderror</label>
            <label>Professor(a)
                <select name="teacher_id" required><option value="">Escolha...</option>
                    @foreach ($professores as $p)<option value="{{ $p->id }}" @selected((string) old('teacher_id', $turma->teacher_id) === (string) $p->id)>{{ $p->name }}</option>@endforeach
                </select>@error('teacher_id')<span class="erro-campo">{{ $message }}</span>@enderror</label>
            <label>Sala
                <select name="room_id" required><option value="">Escolha...</option>
                    @foreach ($salas as $s)<option value="{{ $s->id }}" @selected((string) old('room_id', $turma->room_id) === (string) $s->id)>{{ $s->name }} ({{ $s->capacity }} lugares)</option>@endforeach
                </select>@error('room_id')<span class="erro-campo">{{ $message }}</span>@enderror</label>
        </div>
        <div class="linha">
            <label>Dia da semana
                <select name="weekday" required>
                    @foreach (\App\Models\SchoolClass::DIAS as $n => $d)<option value="{{ $n }}" @selected((string) old('weekday', $turma->weekday) === (string) $n)>{{ $d }}</option>@endforeach
                </select>@error('weekday')<span class="erro-campo">{{ $message }}</span>@enderror</label>
            {{-- o banco guarda 18:00:00; o input type=time trabalha com 18:00 --}}
            <label>Início <input type="time" name="start_time" value="{{ old('start_time', $turma->start_time ? $turma->inicio() : '') }}" required>
                @error('start_time')<span class="erro-campo">{{ $message }}</span>@enderror</label>
            <label>Término <input type="time" name="end_time" value="{{ old('end_time', $turma->end_time ? $turma->fim() : '') }}" required>
                @error('end_time')<span class="erro-campo">{{ $message }}</span>@enderror</label>
        </div>
        <div class="linha">
            <label>Vagas <input type="number" name="capacity" min="1" value="{{ old('capacity', $turma->capacity) }}" required>
                @error('capacity')<span class="erro-campo">{{ $message }}</span>@enderror</label>
            <label>Mensalidade (R$) <input name="monthly_fee" inputmode="decimal" value="{{ old('monthly_fee', $turma->monthly_fee ? number_format($turma->monthly_fee, 2, ',', '.') : '') }}" required>
                @error('monthly_fee')<span class="erro-campo">{{ $message }}</span>@enderror</label>
        </div>
        <label class="inline"><input type="checkbox" name="active" value="1" @checked($errors->any() ? old('active') : $turma->active)> Turma ativa</label>
        @error('active')<span class="erro-campo">{{ $message }}</span>@enderror
        <div class="acoes">
            <button class="botao primario" type="submit">Salvar</button>
            <a class="botao" href="{{ $turma->exists ? route('turmas.show', $turma) : route('turmas.index') }}">Voltar</a>
        </div>
    </form>
@endsection
