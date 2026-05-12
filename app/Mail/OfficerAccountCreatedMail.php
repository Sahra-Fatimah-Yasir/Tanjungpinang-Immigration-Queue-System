<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class OfficerAccountCreatedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly string $name,
        public readonly string $officeName,
        public readonly string $roleLabel,
        public readonly string $nip,
        public readonly string $temporaryPassword,
        public readonly string $loginUrl,
        public readonly string $logoPath,
    ) {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Akun Petugas Sistem Antrian',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.officer-account-created',
            with: [
                'name' => $this->name,
                'officeName' => $this->officeName,
                'roleLabel' => $this->roleLabel,
                'nip' => $this->nip,
                'temporaryPassword' => $this->temporaryPassword,
                'loginUrl' => $this->loginUrl,
                'logoPath' => $this->logoPath,
            ],
        );
    }
}
