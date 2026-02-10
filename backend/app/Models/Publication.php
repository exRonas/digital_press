<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Publication extends Model
{
    use HasFactory;

    protected $fillable = ['title_ru', 'title_kz', 'slug', 'history_ru', 'history_kz'];

    public function issues()
    {
        return $this->hasMany(Issue::class);
    }
}
