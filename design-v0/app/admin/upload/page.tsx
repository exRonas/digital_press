"use client"

import React from "react"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const mockNewspapers = [
  "Казахстанская правда",
  "Егемен Қазақстан",
  "Вечерний Алматы",
  "Астана Times",
  "Қазақ әдебиеті",
  "Экспресс К",
]

export default function AdminUploadPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [formData, setFormData] = useState({
    newspaper: "",
    date: "",
    issueNumber: "",
    language: "",
  })

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      if (file.type === "application/pdf") {
        setSelectedFile(file)
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle form submission
    console.log("Submitting:", { ...formData, file: selectedFile })
  }

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <Button asChild variant="ghost" className="mb-4 gap-2 px-0">
          <Link href="/admin">
            <ArrowLeft className="h-4 w-4" />
            Назад к документам
          </Link>
        </Button>
        <h1 className="font-serif text-2xl font-bold text-foreground">
          Загрузка нового выпуска
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Загрузите PDF файл и заполните метаданные выпуска
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-2">
          {/* File Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">PDF файл</CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedFile ? (
                <div
                  className={`relative flex min-h-[240px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
                    dragActive
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() =>
                    document.getElementById("file-upload")?.click()
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      document.getElementById("file-upload")?.click()
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <input
                    id="file-upload"
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <Upload className="mb-4 h-12 w-12 text-muted-foreground" />
                  <p className="mb-2 text-center text-sm font-medium text-foreground">
                    Перетащите PDF файл сюда
                  </p>
                  <p className="text-center text-sm text-muted-foreground">
                    или нажмите для выбора файла
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-4 rounded-lg border border-border bg-muted/30 p-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-sm bg-primary/10">
                    <Upload className="h-6 w-6 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-foreground">
                      {selectedFile.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedFile(null)}
                    className="shrink-0"
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Удалить файл</span>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Metadata Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Метаданные</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="newspaper" className="mb-2 block">
                  Название газеты
                </Label>
                <Select
                  value={formData.newspaper}
                  onValueChange={(value) =>
                    setFormData({ ...formData, newspaper: value })
                  }
                >
                  <SelectTrigger id="newspaper">
                    <SelectValue placeholder="Выберите газету" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockNewspapers.map((newspaper) => (
                      <SelectItem key={newspaper} value={newspaper}>
                        {newspaper}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="date" className="mb-2 block">
                  Дата выпуска
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor="issueNumber" className="mb-2 block">
                  Номер выпуска
                </Label>
                <Input
                  id="issueNumber"
                  type="number"
                  placeholder="№"
                  value={formData.issueNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, issueNumber: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor="language" className="mb-2 block">
                  Язык
                </Label>
                <Select
                  value={formData.language}
                  onValueChange={(value) =>
                    setFormData({ ...formData, language: value })
                  }
                >
                  <SelectTrigger id="language">
                    <SelectValue placeholder="Выберите язык" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ru">Русский</SelectItem>
                    <SelectItem value="kz">Қазақша</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Form Actions */}
        <div className="mt-6 flex justify-end gap-4">
          <Button asChild variant="outline">
            <Link href="/admin">Отмена</Link>
          </Button>
          <Button
            type="submit"
            disabled={
              !selectedFile ||
              !formData.newspaper ||
              !formData.date ||
              !formData.issueNumber ||
              !formData.language
            }
          >
            Загрузить выпуск
          </Button>
        </div>
      </form>
    </div>
  )
}
