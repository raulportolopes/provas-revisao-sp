<?php

namespace App\Http\Controllers;

use App\Http\Requests\ServiceRequest;
use App\Models\Service;

class ServiceController extends Controller
{
    public function index()
    {
        $servicos = Service::withCount('workOrders')->orderBy('name')->get();

        return view('servicos.index', compact('servicos'));
    }

    public function create()
    {
        return view('servicos.form', ['servico' => new Service(['active' => true])]);
    }

    public function store(ServiceRequest $request)
    {
        Service::create($request->validated());

        return redirect()->route('servicos.index')->with('ok', 'Serviço cadastrado.');
    }

    public function edit(Service $servico)
    {
        return view('servicos.form', compact('servico'));
    }

    public function update(ServiceRequest $request, Service $servico)
    {
        // Mudar o preço aqui NÃO altera ordens antigas: elas guardam o preço na pivot.
        $servico->update($request->validated());

        return redirect()->route('servicos.index')->with('ok', 'Serviço atualizado.');
    }

    public function apagar(Service $servico)
    {
        $servico->loadCount('workOrders');

        return view('servicos.apagar', compact('servico'));
    }

    public function destroy(Service $servico)
    {
        $usos = $servico->workOrders()->count();
        if ($usos > 0) {
            return redirect()->route('servicos.index')
                ->with('erro', "O serviço \"{$servico->name}\" está em {$usos} ordem(ns). Desative em vez de apagar.");
        }
        $servico->delete();

        return redirect()->route('servicos.index')->with('ok', 'Serviço apagado.');
    }
}
