<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BloodType extends Model
{
    protected $fillable = ['code', 'stock_goal_ml'];

    public function donors(): HasMany { return $this->hasMany(Donor::class); }
}
