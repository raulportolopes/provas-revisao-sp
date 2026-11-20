<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/** Histórico de mudanças de situação (tabela work_order_status_logs). */
class StatusLog extends Model
{
    protected $table = 'work_order_status_logs';

    // A tabela só tem created_at (não tem updated_at)
    public const UPDATED_AT = null;

    protected $fillable = ['work_order_id', 'user_id', 'from_status', 'to_status', 'note'];

    protected function casts(): array { return ['created_at' => 'datetime']; }

    public function user() { return $this->belongsTo(User::class); }
}
