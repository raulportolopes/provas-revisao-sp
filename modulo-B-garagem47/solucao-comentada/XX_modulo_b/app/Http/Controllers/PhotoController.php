<?php

namespace App\Http\Controllers;

use App\Models\Photo;
use App\Models\WorkOrder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class PhotoController extends Controller
{
    public const MAX_FOTOS = 6;

    public function store(Request $request, WorkOrder $ordem)
    {
        $this->authorize('fotos', $ordem);

        $jaTem = $ordem->photos()->count();
        $request->validate([
            // max:N no array = no máximo N arquivos neste envio, contando as que já existem
            'fotos' => ['required', 'array', 'min:1', 'max:' . max(0, self::MAX_FOTOS - $jaTem)],
            // mimes confere o CONTEÚDO do arquivo (não só a extensão); max em KB = 2 MB
            'fotos.*' => ['file', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ], [
            'fotos.max' => 'Cada ordem aceita no máximo ' . self::MAX_FOTOS . " fotos (já tem {$jaTem}).",
            'fotos.*.mimes' => 'Envie só imagens JPG, PNG ou WEBP.',
            'fotos.*.max' => 'Cada foto pode ter no máximo 2 MB.',
        ]);

        foreach ($request->file('fotos') as $arquivo) {
            // store() gera um nome único e grava em storage/app/public/ordens/{id}/
            $caminho = $arquivo->store('ordens/' . $ordem->id, 'public');
            $ordem->photos()->create([
                'user_id' => $request->user()->id,
                'path' => $caminho,
                'original_name' => $arquivo->getClientOriginalName(),
            ]);
        }

        return redirect()->route('ordens.show', $ordem)->with('ok', 'Foto(s) enviada(s).');
    }

    public function destroy(WorkOrder $ordem, Photo $photo)
    {
        $this->authorize('delete', $photo);

        Storage::disk('public')->delete($photo->path); // apaga o arquivo...
        $photo->delete();                               // ...e o registro

        return redirect()->route('ordens.show', $ordem)->with('ok', 'Foto apagada.');
    }
}
