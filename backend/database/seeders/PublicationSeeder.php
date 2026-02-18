<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Publication;

class PublicationSeeder extends Seeder
{
    public function run(): void
    {
        $publications = [
            [
                'title_ru' => 'Звезда Прииртышья',
                'title_kz' => 'Ертіс жұлдызы',
                'slug'     => 'zvezda-priirtyshya',
            ],
            [
                'title_ru' => 'Saryarqa Samaly',
                'title_kz' => 'Сарыарқа самалы',
                'slug'     => 'saryarqa-samaly',
            ],
            [
                'title_ru' => 'Қызыл Ту',
                'title_kz' => 'Қызыл Ту',
                'slug'     => 'qyzyl-tu',
            ],
            [
                'title_ru' => 'Версия',
                'title_kz' => 'Версия',
                'slug'     => 'versiia',
            ],
        ];

        foreach ($publications as $data) {
            Publication::updateOrCreate(
                ['slug' => $data['slug']],
                $data
            );
        }

        $this->command->info('Publications seeded: ' . count($publications));
    }
}
