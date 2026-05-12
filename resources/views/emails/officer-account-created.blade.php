@php
    $logoSource = null;

    if (isset($message) && isset($logoPath) && is_string($logoPath) && file_exists($logoPath)) {
        $logoSource = $message->embed($logoPath);
    }
@endphp

<!doctype html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Akun Petugas Sistem Antrian</title>
</head>
<body style="margin: 0; padding: 0; background: #f3f6fb; color: #1a1c1c; font-family: Arial, Helvetica, sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: #f3f6fb; padding: 28px 12px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 620px; overflow: hidden; border-radius: 14px; background: #ffffff; box-shadow: 0 12px 30px rgba(0, 25, 68, 0.12);">
                    <tr>
                        <td style="background: #001944; padding: 26px 28px; color: #ffffff;">
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                                <tr>
                                    <td width="74" valign="middle">
                                        @if ($logoSource)
                                            <img src="{{ $logoSource }}" alt="Logo Imigrasi" width="58" height="58" style="display: block; border-radius: 10px; background: #ffffff; padding: 6px; object-fit: contain;">
                                        @else
                                            <div style="width: 58px; height: 58px; border-radius: 10px; background: #ffffff; color: #001944; font-size: 13px; font-weight: 800; line-height: 58px; text-align: center;">
                                                NADI
                                            </div>
                                        @endif
                                    </td>
                                    <td valign="middle" style="padding-left: 14px;">
                                        <div style="font-size: 12px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; opacity: 0.84;">
                                            Sistem Antrian Terintegrasi
                                        </div>
                                        <div style="margin-top: 7px; font-size: 21px; font-weight: 800; line-height: 1.25;">
                                            {{ $officeName }}
                                        </div>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding: 30px 28px 10px;">
                            <h1 style="margin: 0; color: #001944; font-size: 24px; line-height: 1.25;">
                                Halo, {{ $name }}
                            </h1>
                            <p style="margin: 12px 0 0; color: #454652; font-size: 15px; line-height: 1.65;">
                                Akun petugas Anda sudah dibuat. Gunakan kredensial berikut untuk masuk ke dashboard layanan sesuai peran yang diberikan.
                            </p>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding: 16px 28px 8px;">
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border: 1px solid #d8deea; border-radius: 12px; overflow: hidden;">
                                <tr>
                                    <td style="background: #f8fafc; padding: 13px 16px; width: 38%; color: #64748b; font-size: 12px; font-weight: 800; text-transform: uppercase;">
                                        Role
                                    </td>
                                    <td style="padding: 13px 16px; color: #001944; font-size: 15px; font-weight: 800;">
                                        {{ $roleLabel }}
                                    </td>
                                </tr>
                                <tr>
                                    <td style="background: #f8fafc; border-top: 1px solid #d8deea; padding: 13px 16px; color: #64748b; font-size: 12px; font-weight: 800; text-transform: uppercase;">
                                        Username / NIP
                                    </td>
                                    <td style="border-top: 1px solid #d8deea; padding: 13px 16px; color: #001944; font-family: 'Courier New', monospace; font-size: 17px; font-weight: 800;">
                                        {{ $nip }}
                                    </td>
                                </tr>
                                <tr>
                                    <td style="background: #f8fafc; border-top: 1px solid #d8deea; padding: 13px 16px; color: #64748b; font-size: 12px; font-weight: 800; text-transform: uppercase;">
                                        Password
                                    </td>
                                    <td style="border-top: 1px solid #d8deea; padding: 13px 16px; color: #001944; font-family: 'Courier New', monospace; font-size: 17px; font-weight: 800;">
                                        {{ $temporaryPassword }}
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <tr>
                        <td align="center" style="padding: 24px 28px 12px;">
                            <a href="{{ $loginUrl }}" style="display: inline-block; border-radius: 10px; background: #001944; color: #ffffff; font-size: 15px; font-weight: 800; padding: 13px 24px; text-decoration: none;">
                                Login Officer
                            </a>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding: 12px 28px 28px;">
                            <div style="border-left: 4px solid #d9a441; border-radius: 8px; background: #fff8e8; padding: 13px 15px; color: #5f4613; font-size: 13px; line-height: 1.55;">
                                Simpan data login ini dengan aman. Jangan bagikan password kepada pihak lain.
                            </div>
                            <p style="margin: 18px 0 0; color: #767683; font-size: 12px; line-height: 1.55; text-align: center;">
                                Email ini dikirim otomatis oleh Sistem Antrian {{ $officeName }}.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
