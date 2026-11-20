<?php
namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Carrega os mesmos dados do hemosp_db.sql (database/data/base.json).
 * As datas são relativas a hoje, igual ao .sql (CURDATE()/NOW()), para as regras sempre funcionarem.
 */
class BaseSeeder extends Seeder
{
    private function quando(array $w): Carbon
    {
        return match ($w[0]) {
            'abs' => Carbon::parse($w[1]),
            'day' => Carbon::today()->addDays($w[1])->setTimeFromTimeString($w[2]),
            'min' => Carbon::now()->addMinutes($w[1])->second(0),
        };
    }

    public function run(): void
    {
        $b = json_decode(file_get_contents(database_path('data/base.json')), true);
        $now = now();
        DB::table('appointment_events')->delete();
        DB::table('appointments')->delete();
        DB::table('donors')->delete();
        foreach (['closures', 'centers', 'blood_types', 'users'] as $t) DB::table($t)->delete();

        foreach ($b['users'] as $u) DB::table('users')->insert($u + ['created_at' => $now, 'updated_at' => $now]);
        foreach ($b['blood_types'] as $x) DB::table('blood_types')->insert($x + ['created_at' => $now, 'updated_at' => $now]);
        foreach ($b['centers'] as $x) DB::table('centers')->insert($x + ['created_at' => $now, 'updated_at' => $now]);
        foreach ($b['closures'] as $x) DB::table('closures')->insert($x + ['created_at' => $now, 'updated_at' => $now]);
        foreach ($b['donors'] as $d) {
            [$anos, $dias] = $d['birth'];
            unset($d['birth']);
            $d['birth_date'] = Carbon::today()->subYears($anos)->subDays($dias)->toDateString();
            DB::table('donors')->insert($d + ['created_at' => $now, 'updated_at' => $now]);
        }
        $passos = ['scheduled' => [], 'attended' => ['attended'], 'donated' => ['attended', 'donated'],
                   'unfit' => ['attended', 'unfit'], 'no_show' => ['no_show'], 'cancelled' => ['cancelled']];
        foreach ($b['appointments'] as $a) {
            $inicio = $this->quando($a['when']);
            $criado = $this->quando($a['created']);
            DB::table('appointments')->insert([
                'id' => $a['id'], 'protocol' => sprintf('HEMO-%d-%05d', $criado->year, $a['n']),
                'donor_id' => $a['donor_id'], 'center_id' => $a['center_id'], 'starts_at' => $inicio,
                'status' => $a['status'], 'volume_ml' => $a['volume_ml'], 'unfit_reason' => $a['unfit_reason'],
                'cancelled_at' => $a['status'] === 'cancelled' ? $criado : null, 'created_at' => $criado, 'updated_at' => $criado,
            ]);
            DB::table('appointment_events')->insert(['appointment_id' => $a['id'], 'from_status' => null, 'to_status' => 'scheduled',
                'user_id' => null, 'note' => 'Agendado pelo doador', 'created_at' => $criado, 'updated_at' => $criado]);
            $antes = 'scheduled';
            foreach ($passos[$a['status']] as $s) {
                $q = $a['when'][0] === 'min' ? $now : $inicio;
                DB::table('appointment_events')->insert(['appointment_id' => $a['id'], 'from_status' => $antes, 'to_status' => $s,
                    'user_id' => $s === 'cancelled' ? null : 2, 'note' => null, 'created_at' => $q, 'updated_at' => $q]);
                $antes = $s;
            }
        }
    }
}
