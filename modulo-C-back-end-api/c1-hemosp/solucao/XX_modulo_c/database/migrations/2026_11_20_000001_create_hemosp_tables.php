<?php
// Espelho do hemosp_db.sql para quem quiser montar o banco com "php artisan migrate --seed"
// (na prova o banco já vem pronto no .sql e esta migration aparece como já executada).
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('blood_types', function (Blueprint $t) {
            $t->id();
            $t->string('code', 3)->unique();
            $t->unsignedInteger('stock_goal_ml');
            $t->timestamps();
        });
        Schema::create('centers', function (Blueprint $t) {
            $t->id();
            $t->string('name', 150);
            $t->string('neighborhood', 100);
            $t->string('address', 200);
            $t->time('weekday_opens_at');
            $t->time('weekday_closes_at');
            $t->time('saturday_opens_at')->nullable();
            $t->time('saturday_closes_at')->nullable();
            $t->unsignedTinyInteger('slot_capacity');
            $t->boolean('active')->default(true);
            $t->timestamps();
        });
        Schema::create('closures', function (Blueprint $t) {
            $t->id();
            $t->foreignId('center_id')->nullable()->constrained()->cascadeOnDelete(); // NULL = todas as unidades
            $t->date('date');
            $t->string('reason', 150);
            $t->timestamps();
            $t->unique(['center_id', 'date']);
        });
        Schema::create('donors', function (Blueprint $t) {
            $t->id();
            $t->string('name', 150);
            $t->char('cpf', 11)->unique();
            $t->string('email')->unique();
            $t->string('password');
            $t->date('birth_date');
            $t->enum('sex', ['M', 'F']);
            $t->decimal('weight_kg', 5, 1);
            $t->foreignId('blood_type_id')->nullable()->constrained();
            $t->string('guardian_document_path')->nullable();
            $t->timestamps();
        });
        Schema::create('appointments', function (Blueprint $t) {
            $t->id();
            $t->string('protocol', 20)->unique();
            $t->foreignId('donor_id')->constrained();
            $t->foreignId('center_id')->constrained();
            $t->dateTime('starts_at');
            $t->enum('status', ['scheduled', 'attended', 'donated', 'unfit', 'no_show', 'cancelled'])->default('scheduled');
            $t->unsignedSmallInteger('volume_ml')->nullable();
            $t->string('unfit_reason')->nullable();
            $t->dateTime('cancelled_at')->nullable();
            $t->timestamps();
            $t->index(['center_id', 'starts_at']);
        });
        Schema::create('appointment_events', function (Blueprint $t) {
            $t->id();
            $t->foreignId('appointment_id')->constrained()->cascadeOnDelete();
            $t->string('from_status', 20)->nullable();
            $t->string('to_status', 20);
            $t->foreignId('user_id')->nullable()->constrained(); // NULL = feito pelo próprio doador
            $t->string('note')->nullable();
            $t->timestamps();
        });
    }

    public function down(): void
    {
        foreach (['appointment_events', 'appointments', 'donors', 'closures', 'centers', 'blood_types'] as $t) Schema::dropIfExists($t);
    }
};
