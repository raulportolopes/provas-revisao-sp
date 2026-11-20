<?php

namespace App\Services;

use App\Models\Enrollment;
use App\Models\SchoolClass;
use App\Models\Student;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Todas as regras de matrícula num lugar só:
 *   matricular -> ativa (tem vaga) ou espera (turma cheia)
 *   cancelar   -> apaga mensalidades futuras em aberto e promove o próximo da lista de espera
 * As mensalidades são geradas aqui também, porque nascem junto com a matrícula ativa.
 */
class Matriculas
{
    public const DIA_VENCIMENTO = 10;
    public const DIAS_PRIMEIRO_VENCIMENTO = 5;

    // Devolve a mensagem de erro ou null se pode matricular.
    public function problema(Student $aluno, SchoolClass $turma): ?string
    {
        if (! $turma->active) {
            return 'A turma ' . $turma->code . ' está inativa.';
        }
        $atual = Enrollment::where('student_id', $aluno->id)->where('school_class_id', $turma->id)
            ->whereIn('status', ['ativa', 'espera'])->first();
        if ($atual) {
            return $atual->status === 'ativa'
                ? 'O aluno já está matriculado nesta turma.'
                : 'O aluno já está na lista de espera desta turma.';
        }
        if ($conflito = $this->conflitoDeHorario($aluno, $turma)) {
            return 'Conflito de horário com a turma ' . $conflito->code . ' (' . $conflito->horario() . ').';
        }

        return null;
    }

    // Outra turma em que o aluno está ATIVO, no mesmo dia, com horário sobreposto.
    public function conflitoDeHorario(Student $aluno, SchoolClass $turma): ?SchoolClass
    {
        return SchoolClass::sobrepoe($turma->weekday, $turma->start_time, $turma->end_time)
            ->where('id', '!=', $turma->id)
            ->whereHas('enrollments', fn ($q) => $q->where('student_id', $aluno->id)->where('status', 'ativa'))
            ->first();
    }

    public function matricular(Student $aluno, SchoolClass $turma): Enrollment
    {
        return DB::transaction(function () use ($aluno, $turma) {
            // Trava a turma: duas matrículas ao mesmo tempo não "furam" a última vaga
            $turma = SchoolClass::whereKey($turma->id)->lockForUpdate()->first();
            $ocupadas = $turma->ativas()->count();

            if ($ocupadas >= $turma->capacity) {
                return Enrollment::create([
                    'student_id' => $aluno->id, 'school_class_id' => $turma->id,
                    'status' => 'espera', 'waitlisted_at' => now(),
                ]);
            }

            $matricula = Enrollment::create([
                'student_id' => $aluno->id, 'school_class_id' => $turma->id,
                'status' => 'ativa', 'enrolled_at' => Carbon::today(),
            ]);
            $this->gerarMensalidades($matricula, $turma);

            return $matricula;
        });
    }

    /**
     * Uma mensalidade por mês, do mês atual até dezembro, vencendo no dia 10.
     * Se o dia 10 do mês atual já passou (ou é hoje), a primeira vence daqui a 5 dias.
     * O valor é a mensalidade da turma HOJE (mudar o preço depois não altera as já geradas).
     */
    public function gerarMensalidades(Enrollment $matricula, SchoolClass $turma): void
    {
        $hoje = Carbon::today();
        $mes = $hoje->copy()->startOfMonth();
        $primeira = true;
        while ($mes->year === $hoje->year) {
            $vencimento = $mes->copy()->day(self::DIA_VENCIMENTO);
            if ($primeira && $vencimento->lte($hoje)) {
                $vencimento = $hoje->copy()->addDays(self::DIAS_PRIMEIRO_VENCIMENTO);
            }
            $primeira = false;
            $matricula->invoices()->create([
                'reference_month' => $mes->toDateString(),
                'due_date' => $vencimento->toDateString(),
                'amount' => $turma->monthly_fee,
            ]);
            $mes->addMonth();
        }
    }

    /**
     * Cancela a matrícula. Devolve o aluno promovido da lista de espera (ou null).
     * - mensalidades em aberto que vencem hoje ou depois são apagadas;
     * - pagas e vencidas não pagas ficam (histórico e dívida).
     */
    public function cancelar(Enrollment $matricula): ?Enrollment
    {
        return DB::transaction(function () use ($matricula) {
            $eraAtiva = $matricula->status === 'ativa';
            $matricula->update(['status' => 'cancelada', 'cancelled_at' => Carbon::today()]);
            $matricula->invoices()->whereNull('paid_at')->whereDate('due_date', '>=', Carbon::today())->delete();

            return $eraAtiva ? $this->promoverDaEspera($matricula->schoolClass) : null;
        });
    }

    // Primeiro da fila que NÃO tem conflito de horário vira ativo. Quem tem conflito continua esperando.
    public function promoverDaEspera(SchoolClass $turma): ?Enrollment
    {
        if ($turma->ativas()->count() >= $turma->capacity) {
            return null;
        }
        foreach ($turma->espera()->with('student')->get() as $candidato) {
            if (! $this->conflitoDeHorario($candidato->student, $turma)) {
                $candidato->update(['status' => 'ativa', 'enrolled_at' => Carbon::today()]);
                $this->gerarMensalidades($candidato, $turma);

                return $candidato;
            }
        }

        return null;
    }
}
