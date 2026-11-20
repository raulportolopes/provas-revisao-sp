<?php

namespace App\Http\Controllers;

use App\Http\Requests\VehicleRequest;
use App\Models\Customer;
use App\Models\Vehicle;

class VehicleController extends Controller
{
    public function create(Customer $cliente)
    {
        return view('veiculos.form', ['cliente' => $cliente, 'veiculo' => new Vehicle()]);
    }

    public function store(VehicleRequest $request, Customer $cliente)
    {
        // Cria pela relação: o customer_id é preenchido sozinho (não vem do formulário)
        $cliente->vehicles()->create($request->validated());

        return redirect()->route('clientes.show', $cliente)->with('ok', 'Veículo cadastrado.');
    }

    public function edit(Vehicle $veiculo)
    {
        return view('veiculos.form', ['cliente' => $veiculo->customer, 'veiculo' => $veiculo]);
    }

    public function update(VehicleRequest $request, Vehicle $veiculo)
    {
        $veiculo->update($request->validated());

        return redirect()->route('clientes.show', $veiculo->customer_id)->with('ok', 'Veículo atualizado.');
    }

    public function destroy(Vehicle $veiculo)
    {
        if ($veiculo->workOrders()->exists()) {
            return back()->with('erro', 'O veículo ' . $veiculo->plate . ' tem ordens de serviço e não pode ser apagado.');
        }
        $cliente = $veiculo->customer_id;
        $veiculo->delete();

        return redirect()->route('clientes.show', $cliente)->with('ok', 'Veículo apagado.');
    }
}
