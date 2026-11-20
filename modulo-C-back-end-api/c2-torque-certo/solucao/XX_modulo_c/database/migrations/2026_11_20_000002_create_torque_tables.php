<?php
// Espelho do torque_db.sql para quem quiser montar o banco com "php artisan migrate --seed"
// (na prova o banco já vem pronto no .sql e esta migration aparece como já executada).
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customers', function (Blueprint $t) {
            $t->id(); $t->string('name', 150); $t->char('cpf', 11)->unique();
            $t->string('phone', 11); $t->string('email')->nullable(); $t->timestamps();
        });
        Schema::create('vehicles', function (Blueprint $t) {
            $t->id(); $t->foreignId('customer_id')->constrained(); $t->char('plate', 7)->unique();
            $t->string('brand', 50); $t->string('model', 80); $t->unsignedSmallInteger('year'); $t->timestamps();
        });
        Schema::create('parts', function (Blueprint $t) {
            $t->id(); $t->string('sku', 20)->unique(); $t->string('name', 150); $t->unsignedInteger('price_cents');
            $t->unsignedInteger('stock_qty')->default(0); $t->unsignedInteger('min_stock')->default(0); $t->timestamps();
        });
        Schema::create('services', function (Blueprint $t) {
            $t->id(); $t->string('name', 150); $t->unsignedInteger('price_cents'); $t->unsignedSmallInteger('minutes'); $t->timestamps();
        });
        Schema::create('service_orders', function (Blueprint $t) {
            $t->id(); $t->string('number', 12)->unique();
            $t->foreignId('vehicle_id')->constrained();
            $t->foreignId('mechanic_id')->nullable()->constrained('users');
            $t->enum('status', ['aberta', 'orcada', 'aprovada', 'em_execucao', 'concluida', 'entregue', 'cancelada'])->default('aberta');
            $t->text('complaint'); $t->decimal('discount_percent', 4, 1)->default(0);
            $t->dateTime('opened_at'); $t->dateTime('delivered_at')->nullable();
            $t->softDeletes(); $t->timestamps();
        });
        Schema::create('service_order_items', function (Blueprint $t) {
            $t->id(); $t->foreignId('service_order_id')->constrained()->cascadeOnDelete();
            $t->foreignId('part_id')->nullable()->constrained(); $t->foreignId('service_id')->nullable()->constrained();
            $t->unsignedSmallInteger('quantity'); $t->unsignedInteger('unit_price_cents'); $t->timestamps();
        });
        Schema::create('service_order_photos', function (Blueprint $t) {
            $t->id(); $t->foreignId('service_order_id')->constrained()->cascadeOnDelete();
            $t->string('path'); $t->string('thumb_path'); $t->string('original_name'); $t->timestamps();
        });
        Schema::create('service_order_events', function (Blueprint $t) {
            $t->id(); $t->foreignId('service_order_id')->constrained()->cascadeOnDelete();
            $t->string('from_status', 20)->nullable(); $t->string('to_status', 20);
            $t->foreignId('user_id')->constrained(); $t->timestamps();
        });
    }

    public function down(): void
    {
        foreach (['service_order_events', 'service_order_photos', 'service_order_items', 'service_orders', 'services', 'parts', 'vehicles', 'customers'] as $t)
            Schema::dropIfExists($t);
    }
};
