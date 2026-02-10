import { useState, useEffect, useRef } from "react"
import { Link, useNavigate } from "react-router-dom"
import { ArrowLeft, Upload, X, Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import axios from "axios"
import { useToast } from "@/components/ui/use-toast"

interface Publication {
    id: number;
    title_ru: string;
    title_kz?: string;
}

type UploadStatus = 'idle' | 'uploading' | 'processing' | 'success' | 'error';

const FALLBACK_CHUNK_SIZE = 1 * 1024 * 1024; // 1MB fallback

export function AdminUploadPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [formData, setFormData] = useState({
    publication_id: "",
    date: "",
    issueNumber: "",
    language: "",
  })
  const [publications, setPublications] = useState<Publication[]>([])
  
  // Upload state
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadMessage, setUploadMessage] = useState("")
  const abortControllerRef = useRef<AbortController | null>(null)
  const uploadIdRef = useRef<string | null>(null)
  
  const navigate = useNavigate()
  const { toast } = useToast()

  useEffect(() => {
    axios.get('/publications')
        .then(res => setPublications(res.data))
        .catch(err => console.error("Failed to fetch publications", err));
  }, []);

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
        setUploadStatus('idle')
        setUploadProgress(0)
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
      setUploadStatus('idle')
      setUploadProgress(0)
    }
  }

  const uploadChunked = async (file: File): Promise<string> => {
    // Step 1: Initialize upload
    setUploadMessage("Инициализация загрузки...")
    const initResponse = await axios.post('/admin/upload/init', {
      filename: file.name,
      filesize: file.size,
    });
    
    const uploadId = initResponse.data.upload_id;
    const chunkSize = initResponse.data.chunk_size || FALLBACK_CHUNK_SIZE;
    const totalChunks = initResponse.data.total_chunks || Math.ceil(file.size / chunkSize);
    uploadIdRef.current = uploadId;
    
    // Step 2: Upload chunks
    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      // Check if aborted
      if (abortControllerRef.current?.signal.aborted) {
        throw new Error('Upload cancelled');
      }
      
      const start = chunkIndex * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      const chunk = file.slice(start, end);
      
      const chunkFormData = new FormData();
      chunkFormData.append('upload_id', uploadId);
      chunkFormData.append('chunk_index', chunkIndex.toString());
      chunkFormData.append('chunk', chunk, `chunk_${chunkIndex}`);
      
      await axios.post('/admin/upload/chunk', chunkFormData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        signal: abortControllerRef.current?.signal,
      });
      
      const progress = Math.round(((chunkIndex + 1) / totalChunks) * 100);
      setUploadProgress(progress);
      setUploadMessage(`Загрузка: ${progress}% (${chunkIndex + 1}/${totalChunks} частей)`);
    }
    
    return uploadId;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedFile || !formData.publication_id || !formData.date || !formData.issueNumber || !formData.language) {
        toast({
            title: "Ошибка",
            description: "Пожалуйста, заполните все поля и выберите файл",
            variant: "destructive"
        })
        return;
    }

    // Reset state
    setUploadStatus('uploading');
    setUploadProgress(0);
    abortControllerRef.current = new AbortController();

    try {
        // For small files (< 10MB), use legacy single-request upload
        if (selectedFile.size < 10 * 1024 * 1024) {
            setUploadMessage("Загрузка файла...")
            const submitData = new FormData();
            submitData.append('file', selectedFile);
            submitData.append('publication_id', formData.publication_id);
            submitData.append('issue_date', formData.date);
            submitData.append('issue_number', formData.issueNumber);
            submitData.append('language', formData.language);

            await axios.post('/admin/issues', submitData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (progressEvent) => {
                    if (progressEvent.total) {
                        const progress = Math.round((progressEvent.loaded / progressEvent.total) * 100);
                        setUploadProgress(progress);
                        setUploadMessage(`Загрузка: ${progress}%`);
                    }
                },
                signal: abortControllerRef.current.signal,
            });
        } else {
            // For large files, use chunked upload
            const uploadId = await uploadChunked(selectedFile);
            
            // Step 3: Complete upload
            setUploadStatus('processing');
            setUploadMessage("Обработка файла на сервере...");
            
            await axios.post('/admin/upload/complete', {
                upload_id: uploadId,
                publication_id: formData.publication_id,
                issue_date: formData.date,
                issue_number: formData.issueNumber,
                language: formData.language,
            });
        }
        
        setUploadStatus('success');
        setUploadMessage("Загрузка завершена!");
        
        toast({
            title: "Успешно",
            description: "Выпуск загружен"
        });
        
        // Navigate after a short delay so user can see success
        setTimeout(() => navigate('/admin'), 1500);

    } catch (err: any) {
        if (err.message === 'Upload cancelled' || axios.isCancel(err)) {
            setUploadStatus('idle');
            setUploadProgress(0);
            setUploadMessage("");
            // Cleanup on server
            if (uploadIdRef.current) {
                axios.post('/admin/upload/abort', { upload_id: uploadIdRef.current }).catch(() => {});
            }
            return;
        }
        
        setUploadStatus('error');
        setUploadMessage(err.response?.data?.message || "Ошибка загрузки");
        
        toast({
            title: "Ошибка",
            description: err.response?.data?.message || "Ошибка загрузки",
            variant: "destructive"
        });
    }
  }

  const handleCancel = () => {
    if (abortControllerRef.current) {
        abortControllerRef.current.abort();
    }
    setUploadStatus('idle');
    setUploadProgress(0);
    setUploadMessage("");
  };

  const isUploading = uploadStatus === 'uploading' || uploadStatus === 'processing';

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <Button asChild variant="ghost" className="mb-4 gap-2 px-0">
          <Link to="/admin">
            <ArrowLeft className="h-4 w-4" />
            Назад к документам
          </Link>
        </Button>
        <h1 className="font-serif text-2xl font-bold text-foreground">
          Загрузка нового выпуска
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Загрузите PDF файл и заполните метаданные выпуска. Поддерживаются файлы до 500 МБ.
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
                <div className="space-y-4">
                  {/* File Info */}
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
                        {selectedFile.size >= 10 * 1024 * 1024 && (
                          <span className="ml-2 text-xs text-amber-600">
                            (будет загружен частями)
                          </span>
                        )}
                      </p>
                    </div>
                    {!isUploading && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedFile(null);
                          setUploadStatus('idle');
                          setUploadProgress(0);
                        }}
                        className="shrink-0"
                      >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Удалить файл</span>
                      </Button>
                    )}
                  </div>

                  {/* Upload Progress */}
                  {(isUploading || uploadStatus === 'success' || uploadStatus === 'error') && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        {uploadStatus === 'uploading' && (
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        )}
                        {uploadStatus === 'processing' && (
                          <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
                        )}
                        {uploadStatus === 'success' && (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        )}
                        {uploadStatus === 'error' && (
                          <AlertCircle className="h-4 w-4 text-destructive" />
                        )}
                        <span className={`text-sm ${
                          uploadStatus === 'error' ? 'text-destructive' : 
                          uploadStatus === 'success' ? 'text-green-600' : 'text-muted-foreground'
                        }`}>
                          {uploadMessage}
                        </span>
                      </div>
                      
                      <Progress 
                        value={uploadProgress} 
                        className={`h-2 ${
                          uploadStatus === 'error' ? '[&>div]:bg-destructive' :
                          uploadStatus === 'success' ? '[&>div]:bg-green-500' :
                          uploadStatus === 'processing' ? '[&>div]:bg-amber-500' : ''
                        }`}
                      />
                      
                      {isUploading && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleCancel}
                          className="mt-2"
                        >
                          Отменить загрузку
                        </Button>
                      )}
                    </div>
                  )}
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
                  value={formData.publication_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, publication_id: value })
                  }
                  disabled={isUploading}
                >
                  <SelectTrigger id="newspaper">
                    <SelectValue placeholder="Выберите газету" />
                  </SelectTrigger>
                  <SelectContent>
                    {publications.map((pub) => (
                      <SelectItem key={pub.id} value={pub.id.toString()}>
                        {pub.title_ru}
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
                  disabled={isUploading}
                />
              </div>

              <div>
                <Label htmlFor="issueNumber" className="mb-2 block">
                  Номер выпуска
                </Label>
                <Input
                  id="issueNumber"
                  type="number"
                  placeholder="2847"
                  value={formData.issueNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, issueNumber: e.target.value })
                  }
                  disabled={isUploading}
                />
              </div>

              <div>
                <Label htmlFor="language" className="mb-2 block">
                  Язык издания
                </Label>
                <Select
                  value={formData.language}
                  onValueChange={(value) =>
                    setFormData({ ...formData, language: value })
                  }
                  disabled={isUploading}
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

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" asChild disabled={isUploading}>
                  <Link to="/admin">Отмена</Link>
                </Button>
                <Button type="submit" disabled={isUploading || uploadStatus === 'success'}>
                    {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {uploadStatus === 'success' ? 'Загружено!' : 'Загрузить'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  )
}
