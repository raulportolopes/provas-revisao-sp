@extends('layout')
@section('titulo', $ordem->exists ? 'Editar ' . $ordem->code : 'Abrir ordem')
@section('conteudo')
    <h1>{{ $ordem->exists ? 'Editar ordem ' . $ordem->code : 'Abrir ordem de serviço' }}</h1>
    @php
        // Serviços marcados: depois de um erro de validação vale o que foi enviado (mesmo vazio);
        // na primeira abertura valem os serviços já gravados na ordem.
        $marcadosAgora = array_map('intval', $errors->any() ? old('services', []) : $marcados);
    @endphp
    <form method="POST" class="form card"
          action="{{ $ordem->exists ? route('ordens.update', $ordem) : route('ordens.store') }}">
        @csrf
        @if ($ordem->exists) @method('PUT') @endif

        @if ($ordem->exists)
            <p><strong>Veículo:</strong> {{ $ordem->vehicle->descricao() }} · {{ $ordem->vehicle->customer->name }}
               · {{ number_format($ordem->km, 0, ',', '.') }} km</p>
        @else
            <label>Veículo
                <select name="vehicle_id" required>
                    <option value="">Escolha...</option>
                    @foreach ($veiculos as $v)
                        <option value="{{ $v->id }}" @selected((string) old('vehicle_id', $ordem->vehicle_id) === (string) $v->id)>
                            {{ $v->descricao() }} · {{ $v->customer->name }}
                        </option>
                    @endforeach
                </select>
                @error('vehicle_id') <span class="erro-campo">{{ $message }}</span> @enderror
            </label>
            <label>Quilometragem atual
                <input type="number" name="km" min="0" value="{{ old('km') }}" required>
                @error('km') <span class="erro-campo">{{ $message }}</span> @enderror
            </label>
        @endif

        <label>Relato do cliente
            <textarea name="complaint" required maxlength="500">{{ old('complaint', $ordem->complaint) }}</textarea>
            @error('complaint') <span class="erro-campo">{{ $message }}</span> @enderror
        </label>
        <div class="linha">
            <label>Prazo de entrega
                {{-- input date trabalha em AAAA-MM-DD; a TELA mostra dd/mm/aaaa em todo o resto do sistema --}}
                <input type="date" name="due_date" value="{{ old('due_date', $ordem->due_date?->format('Y-m-d')) }}" required>
                @error('due_date') <span class="erro-campo">{{ $message }}</span> @enderror
            </label>
            <label>Mecânico responsável
                <select name="mechanic_id">
                    <option value="">Definir depois</option>
                    @foreach ($mecanicos as $m)
                        <option value="{{ $m->id }}" @selected((string) old('mechanic_id', $ordem->mechanic_id) === (string) $m->id)>{{ $m->name }}</option>
                    @endforeach
                </select>
                @error('mechanic_id') <span class="erro-campo">{{ $message }}</span> @enderror
            </label>
        </div>

        <fieldset class="checks">
            <legend>Serviços</legend>
            @foreach ($servicos as $s)
                <label class="inline">
                    <input type="checkbox" name="services[]" value="{{ $s->id }}" @checked(in_array($s->id, $marcadosAgora, true))>
                    {{ $s->name }} · {{ Formato::moeda($s->price) }} @unless ($s->active) <em class="muted">(inativo)</em> @endunless
                </label>
            @endforeach
        </fieldset>
        @error('services.*') <span class="erro-campo">{{ $message }}</span> @enderror

        <div class="acoes">
            <button class="botao primario" type="submit">Salvar</button>
            <a class="botao" href="{{ $ordem->exists ? route('ordens.show', $ordem) : route('ordens.index') }}">Voltar</a>
        </div>
    </form>
@endsection
