<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Rules\Cpf;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    private function json(Customer $c): array
    {
        return [
            'id' => $c->id, 'name' => $c->name, 'cpf' => $c->maskedCpf(), 'phone' => $c->maskedPhone(), 'email' => $c->email,
            'vehicles' => $c->vehicles->map(fn ($v) => ['id' => $v->id, 'plate' => $v->plate, 'brand' => $v->brand, 'model' => $v->model, 'year' => $v->year]),
        ];
    }

    /** GET /api/customers?search= – nome, começo do CPF ou placa (com ou sem hífen). */
    public function index(Request $request)
    {
        $request->validate(['search' => 'nullable|string|max:100']);
        $p = Customer::with('vehicles')
            ->when($request->search, function ($q, $busca) {
                $digitos = preg_replace('/\D/', '', $busca);
                $placa = strtoupper(preg_replace('/[^A-Za-z0-9]/', '', $busca));
                $q->where(fn ($w) => $w->where('name', 'like', "%{$busca}%")
                    ->when(strlen($digitos) >= 3 && preg_match('/^[\d.\-\s]+$/', $busca), fn ($w2) => $w2->orWhere('cpf', 'like', "{$digitos}%"))
                    ->orWhereHas('vehicles', fn ($v) => $v->where('plate', $placa)));
            })
            ->orderBy('name')->paginate(10);

        return ['data' => collect($p->items())->map(fn ($c) => $this->json($c)),
                'meta' => ['current_page' => $p->currentPage(), 'last_page' => $p->lastPage(), 'per_page' => $p->perPage(), 'total' => $p->total()]];
    }

    /** POST /api/customers */
    public function store(Request $request)
    {
        // normaliza antes de validar (o banco guarda só números)
        $request->merge([
            'cpf' => preg_replace('/\D/', '', (string) $request->cpf),
            'phone' => preg_replace('/\D/', '', (string) $request->phone),
        ]);
        $dados = $request->validate([
            'name' => 'required|string|min:3|max:150',
            'cpf' => ['required', new Cpf, 'unique:customers,cpf'],
            'phone' => ['required', 'regex:/^\d{10,11}$/'],
            'email' => 'nullable|email|max:255',
        ], ['cpf.unique' => 'CPF já cadastrado.', 'phone.regex' => 'Telefone com DDD: 10 ou 11 números.']);

        $c = Customer::create($dados);
        return response()->json($this->json($c->load('vehicles')), 201);
    }

    /** POST /api/customers/{customer}/vehicles */
    public function storeVehicle(Request $request, Customer $customer)
    {
        $request->merge(['plate' => strtoupper(preg_replace('/[^A-Za-z0-9]/', '', (string) $request->plate))]);
        $dados = $request->validate([
            // placa antiga ABC1234 ou Mercosul ABC1D23
            'plate' => ['required', 'regex:/^[A-Z]{3}\d[A-Z0-9]\d{2}$/', 'unique:vehicles,plate'],
            'brand' => 'required|string|max:50',
            'model' => 'required|string|max:80',
            'year' => 'required|integer|between:1950,' . (now()->year + 1),
        ], ['plate.regex' => 'Placa inválida (ABC1234 ou ABC1D23).', 'plate.unique' => 'Placa já cadastrada.']);

        $v = $customer->vehicles()->create($dados);
        return response()->json(['id' => $v->id, 'customer_id' => $customer->id] + $dados, 201);
    }
}
