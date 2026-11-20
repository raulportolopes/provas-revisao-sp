<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Part;
use App\Models\ServiceOrder;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PartController extends Controller
{
    /** GET /api/parts?search=&low_stock=1&sort=&page= */
    public function index(Request $request)
    {
        $request->validate([
            'search' => 'nullable|string|max:100',
            'low_stock' => 'nullable|boolean',
            'sort' => ['nullable', Rule::in(['name', '-name', 'price', '-price', 'stock', '-stock'])],
        ]);
        $sort = $request->input('sort', 'name');
        $coluna = ['name' => 'name', 'price' => 'price_cents', 'stock' => 'stock_qty'][ltrim($sort, '-')];

        $p = Part::query()
            ->when($request->search, fn ($q, $b) => $q->where(fn ($w) => $w->where('name', 'like', "%{$b}%")->orWhere('sku', 'like', "%{$b}%")))
            ->when($request->boolean('low_stock'), fn ($q) => $q->lowStock())
            ->orderBy($coluna, str_starts_with($sort, '-') ? 'desc' : 'asc')->orderBy('id')
            ->paginate(10)->withQueryString();

        return [
            'data' => collect($p->items())->map(fn ($x) => [
                'id' => $x->id, 'sku' => $x->sku, 'name' => $x->name, 'price_cents' => $x->price_cents,
                'price_formatted' => ServiceOrder::brl($x->price_cents), 'stock_qty' => $x->stock_qty, 'min_stock' => $x->min_stock,
                'low_stock' => $x->stock_qty < $x->min_stock,
            ]),
            'meta' => ['current_page' => $p->currentPage(), 'last_page' => $p->lastPage(), 'per_page' => $p->perPage(), 'total' => $p->total()],
        ];
    }
}
