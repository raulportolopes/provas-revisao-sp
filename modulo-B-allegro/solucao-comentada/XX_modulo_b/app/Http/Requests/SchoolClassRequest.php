<?php

namespace App\Http\Requests;

use App\Models\SchoolClass;
use App\Services\Grade;
use App\Support\Formato;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class SchoolClassRequest extends FormRequest
{
    public function authorize(): bool
    {
        $turma = $this->route('turma');

        return $turma ? $this->user()->can('update', $turma) : $this->user()->can('create', SchoolClass::class);
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'code' => strtoupper(trim((string) $this->code)),
            'monthly_fee' => Formato::numeroDigitado($this->monthly_fee),
            'active' => $this->boolean('active'),
        ]);
    }

    public function rules(): array
    {
        $turma = $this->route('turma');

        return [
            'code' => ['required', 'max:20', 'regex:/^[A-Z0-9-]+$/', Rule::unique('school_classes', 'code')->ignore($turma?->id)],
            'instrument_id' => ['required', 'integer', 'exists:instruments,id'],
            'teacher_id' => ['required', 'integer', Rule::exists('users', 'id')->where('role', 'professor')->where('active', 1)],
            'room_id' => ['required', 'integer', 'exists:rooms,id'],
            'level' => ['required', Rule::in(array_keys(SchoolClass::NIVEIS))],
            'weekday' => ['required', 'integer', 'between:1,6'],
            'start_time' => ['required', 'date_format:H:i', 'after_or_equal:08:00'],
            'end_time' => ['required', 'date_format:H:i', 'after:start_time', 'before_or_equal:22:00'],
            'capacity' => ['required', 'integer', 'min:1'],
            'monthly_fee' => ['required', 'numeric', 'decimal:0,2', 'gt:0'],
            'active' => ['boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'code.regex' => 'O código só pode ter letras, números e hífen.',
            'code.unique' => 'Já existe uma turma com este código.',
            'teacher_id.exists' => 'Escolha um(a) professor(a) ativo(a).',
            'start_time.after_or_equal' => 'A escola abre às 08:00.',
            'end_time.before_or_equal' => 'A escola fecha às 22:00.',
            'end_time.after' => 'O término deve ser depois do início.',
        ];
    }

    // after(): regras que dependem de VÁRIOS campos e do banco. Rodam depois das regras simples passarem.
    public function after(): array
    {
        return [function (Validator $v) {
            if ($v->errors()->isNotEmpty()) {
                return;
            }
            $d = $this->all();
            $turma = $this->route('turma');

            $duracao = (strtotime($d['end_time']) - strtotime($d['start_time'])) / 60;
            if ($duracao < 30 || $duracao > 180) {
                $v->errors()->add('end_time', 'A aula deve durar de 30 minutos a 3 horas.');
            }

            $sala = \App\Models\Room::find($d['room_id']);
            if ($d['capacity'] > $sala->capacity) {
                $v->errors()->add('capacity', "A {$sala->name} comporta no máximo {$sala->capacity} alunos.");
            }
            if ($turma) {
                $ativas = $turma->ativas()->count();
                if ($d['capacity'] < $ativas) {
                    $v->errors()->add('capacity', "A turma já tem {$ativas} alunos ativos: as vagas não podem ser menos que isso.");
                }
                $pendentes = $turma->enrollments()->whereIn('status', ['ativa', 'espera'])->count();
                if (! $d['active'] && $pendentes > 0) {
                    $v->errors()->add('active', "A turma tem {$pendentes} matrícula(s) ativa(s) ou em espera e não pode ser desativada.");
                }
            }

            // Conflito de sala e de professor: só para turma ativa
            if ($d['active']) {
                foreach (app(Grade::class)->conflitos($d, $turma?->id) as $erro) {
                    $v->errors()->add('weekday', $erro);
                }
            }
        }];
    }
}
