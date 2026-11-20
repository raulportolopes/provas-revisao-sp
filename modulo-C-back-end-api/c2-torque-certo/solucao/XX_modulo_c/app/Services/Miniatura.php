<?php
namespace App\Services;

use Illuminate\Http\UploadedFile;

/** Gera a miniatura com a biblioteca GD (vem no XAMPP): largura fixa, altura proporcional, JPEG. */
class Miniatura
{
    public const WIDTH = 320;

    /** Devolve [conteúdo JPEG, largura, altura]. */
    public function gerar(UploadedFile $arquivo): array
    {
        $origem = match ($arquivo->getMimeType()) {
            'image/png' => imagecreatefrompng($arquivo->getRealPath()),
            default => imagecreatefromjpeg($arquivo->getRealPath()),
        };
        [$w, $h] = [imagesx($origem), imagesy($origem)];
        $nh = (int) round($h * self::WIDTH / $w);

        $destino = imagecreatetruecolor(self::WIDTH, $nh);
        imagefill($destino, 0, 0, imagecolorallocate($destino, 255, 255, 255)); // fundo branco para PNG transparente
        imagecopyresampled($destino, $origem, 0, 0, 0, 0, self::WIDTH, $nh, $w, $h);

        ob_start();
        imagejpeg($destino, null, 80);
        $jpeg = ob_get_clean();
        imagedestroy($origem);
        imagedestroy($destino);
        return [$jpeg, self::WIDTH, $nh];
    }
}
