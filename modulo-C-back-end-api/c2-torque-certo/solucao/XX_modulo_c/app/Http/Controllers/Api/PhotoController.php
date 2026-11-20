<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ServiceOrder;
use App\Services\Miniatura;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class PhotoController extends Controller
{
    public const MAX_PHOTOS = 5;

    /** POST /api/orders/{order}/photos (multipart, campo "photo") */
    public function store(Request $request, ServiceOrder $order, Miniatura $mini)
    {
        $request->validate(['photo' => ['required', 'file', 'mimes:jpg,jpeg,png', 'max:4096', 'dimensions:min_width=320,min_height=200']]);
        if ($order->photos()->count() >= self::MAX_PHOTOS) {
            return response()->json(['message' => 'Limite de ' . self::MAX_PHOTOS . ' fotos por OS.'], 409);
        }
        $arq = $request->file('photo');
        $nome = Str::uuid();
        // disco "public" = storage/app/public, servido em /storage (php artisan storage:link)
        $caminho = $arq->storeAs("orders/{$order->id}", "{$nome}." . $arq->extension(), 'public');
        [$jpeg, $w, $h] = $mini->gerar($arq);
        $thumb = "orders/{$order->id}/{$nome}_thumb.jpg";
        Storage::disk('public')->put($thumb, $jpeg);

        $foto = $order->photos()->create(['path' => $caminho, 'thumb_path' => $thumb, 'original_name' => $arq->getClientOriginalName()]);
        return response()->json([
            'id' => $foto->id, 'url' => url(Storage::url($caminho)), 'thumb_url' => url(Storage::url($thumb)),
            'thumb_width' => $w, 'thumb_height' => $h,
        ], 201);
    }
}
