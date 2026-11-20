<?php
namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/** Carrega os mesmos dados do torque_db.sql (database/data/base.json). */
class BaseSeeder extends Seeder
{
    public function run(): void
    {
        $b = json_decode(file_get_contents(database_path('data/base.json')), true);
        $t = ['service_order_events', 'service_order_photos', 'service_order_items', 'service_orders', 'services', 'parts', 'vehicles', 'customers', 'users'];
        foreach ($t as $tab) DB::table($tab)->delete();
        $agora = '2026-11-19 09:00:00';
        foreach (array_reverse($t) as $tab) {
            foreach ($b[$tab] ?? [] as $linha) {
                DB::table($tab)->insert($linha + ['created_at' => $agora, 'updated_at' => $linha['created_at'] ?? $agora]);
            }
        }
    }
}
