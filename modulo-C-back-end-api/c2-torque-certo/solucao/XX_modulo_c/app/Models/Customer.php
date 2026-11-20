<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Customer extends Model
{
    protected $fillable = ['name', 'cpf', 'phone', 'email'];

    public function vehicles(): HasMany { return $this->hasMany(Vehicle::class); }

    public function maskedCpf(): string { return preg_replace('/(\d{3})(\d{3})(\d{3})(\d{2})/', '$1.$2.$3-$4', $this->cpf); }

    /** (11) 98765-4321 ou (11) 3322-4455 */
    public function maskedPhone(): string
    {
        return strlen($this->phone) === 11
            ? preg_replace('/(\d{2})(\d{5})(\d{4})/', '($1) $2-$3', $this->phone)
            : preg_replace('/(\d{2})(\d{4})(\d{4})/', '($1) $2-$3', $this->phone);
    }
}
