<?php
namespace App\Providers;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void {}

    public function boot(): void
    {
        Carbon::setLocale('pt_BR');
        Gate::define('admin', fn (User $u) => $u->isAdmin());
    }
}
