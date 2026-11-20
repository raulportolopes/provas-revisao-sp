<?php

namespace App\Http\Controllers;

use App\Http\Requests\CustomerRequest;
use App\Models\Customer;
use App\Support\Formato;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    public function index(Request $request)
    {
        $busca = trim((string) $request->query('busca'));

        $clientes = Customer::withCount('vehicles')
            ->when($busca !== '', function ($q) use ($busca) {
                // Busca por parte do nome OU pelo CPF (com ou sem máscara)
                $q->where(function ($q) use ($busca) {
                    $q->where('name', 'like', "%{$busca}%");
                    $digitos = Formato::digitos($busca);
                    if ($digitos !== '') {
                        $q->orWhere('cpf', 'like', "%{$digitos}%");
                    }
                });
            })
            ->orderBy('name')->orderBy('id')
            ->paginate(10)
            ->withQueryString(); // mantém ?busca= nos links das páginas

        return view('clientes.index', compact('clientes', 'busca'));
    }

    public function create()
    {
        return view('clientes.form', ['cliente' => new Customer()]);
    }

    public function store(CustomerRequest $request)
    {
        $cliente = Customer::create($request->validated());

        return redirect()->route('clientes.show', $cliente)->with('ok', 'Cliente cadastrado.');
    }

    public function show(Customer $cliente)
    {
        // Eager loading: carrega veículos, ordens e o necessário para o total de uma vez (evita N+1)
        $cliente->load(['vehicles' => fn ($q) => $q->withCount('workOrders')->orderBy('plate')]);
        $ordens = $cliente->workOrders()->with(['vehicle', 'services', 'items'])
            ->orderByDesc('opened_at')->orderByDesc('work_orders.id')->get();

        return view('clientes.show', compact('cliente', 'ordens'));
    }

    public function edit(Customer $cliente)
    {
        return view('clientes.form', compact('cliente'));
    }

    public function update(CustomerRequest $request, Customer $cliente)
    {
        $cliente->update($request->validated());

        return redirect()->route('clientes.show', $cliente)->with('ok', 'Cliente atualizado.');
    }

    // Página de confirmação (GET /clientes/{id}/apagar)
    public function apagar(Customer $cliente)
    {
        return view('clientes.apagar', compact('cliente'));
    }

    public function destroy(Customer $cliente)
    {
        // Regra: cliente com ordem de serviço (em qualquer veículo) NÃO pode ser apagado.
        // Sem ordens, os veículos dele são apagados junto (ON DELETE CASCADE no banco).
        if ($cliente->workOrders()->exists()) {
            return redirect()->route('clientes.show', $cliente)
                ->with('erro', 'Cliente possui ordens de serviço e não pode ser apagado.');
        }
        $cliente->delete();

        return redirect()->route('clientes.index')->with('ok', 'Cliente apagado.');
    }
}
