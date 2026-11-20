<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** Histórico de mudanças de situação da OS (quem e quando). */
class ServiceOrderEvent extends Model
{
    protected $fillable = ['service_order_id', 'from_status', 'to_status', 'user_id'];

    public function user(): BelongsTo { return $this->belongsTo(User::class); }
}
