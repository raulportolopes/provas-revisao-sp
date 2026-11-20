<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class Photo extends Model
{
    protected $table = 'work_order_photos';

    protected $fillable = ['work_order_id', 'user_id', 'path', 'original_name'];

    public function user() { return $this->belongsTo(User::class); }
    public function workOrder() { return $this->belongsTo(WorkOrder::class); }

    // URL pública: http://servidor/XX_modulo_b/storage/ordens/7/abc.jpg
    public function url(): string { return Storage::disk('public')->url($this->path); }
}
