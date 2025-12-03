"use client"

import dynamic from "next/dynamic"
import { FileText, Info, Lightbulb } from "lucide-react"
import { EditorLoader } from "@/components/ui/dynamic-loader"
import { cn } from "@/lib/utils"
import type { NewEventFormData } from "../types"

// Importar ReactQuill dinamicamente
const ReactQuill = dynamic(() => import("react-quill"), { 
  ssr: false,
  loading: () => <EditorLoader />
})
import "react-quill/dist/quill.snow.css"

interface Step3DescriptionProps {
  formData: NewEventFormData
  setFormData: React.Dispatch<React.SetStateAction<NewEventFormData>>
}

// Dicas de descrição
const DICAS = [
  "Descreva o percurso e as características da prova",
  "Informe sobre kit, medalhas e premiações",
  "Mencione pontos de hidratação e apoio",
  "Inclua informações sobre estacionamento",
  "Adicione orientações sobre retirada de kit",
]

export function Step3Description({ formData, setFormData }: Step3DescriptionProps) {
  const quillModules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ list: "ordered" }, { list: "bullet" }],
      [{ align: [] }],
      ["link"],
      ["clean"],
    ],
  }

  const quillFormats = [
    "header",
    "bold",
    "italic",
    "underline",
    "strike",
    "list",
    "bullet",
    "align",
    "link",
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Descrição do Evento</h3>
        <p className="text-sm text-gray-500">Adicione informações detalhadas sobre o seu evento</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Editor Principal */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50 bg-gradient-to-r from-gray-50/50 to-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-semibold text-gray-900">Descrição Completa</h4>
                  <p className="text-sm text-gray-500">Use o editor para formatar o texto</p>
                </div>
              </div>
            </div>
            <div className="p-4">
              <div className="rounded-xl overflow-hidden border border-gray-200">
                <ReactQuill
                  theme="snow"
                  value={formData.descricao}
                  onChange={(value) => setFormData({ ...formData, descricao: value })}
                  modules={quillModules}
                  formats={quillFormats}
                  placeholder="Descreva seu evento em detalhes..."
                  className="min-h-[400px] [&_.ql-container]:min-h-[350px] [&_.ql-editor]:min-h-[350px]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar com Dicas */}
        <div className="space-y-4">
          {/* Card de Dicas */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-100 p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <Lightbulb className="w-5 h-5 text-amber-600" />
              </div>
              <h4 className="font-semibold text-gray-900">Dicas</h4>
            </div>
            <ul className="space-y-3">
              {DICAS.map((dica, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-700 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                    {index + 1}
                  </span>
                  <span className="text-sm text-gray-700">{dica}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Card Informativo */}
          <div className="bg-blue-50 rounded-2xl border border-blue-100 p-5">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Info className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h5 className="font-medium text-gray-900 mb-1">Formatação</h5>
                <p className="text-sm text-gray-600">
                  Use <strong>negrito</strong> para destacar informações importantes e
                  listas para organizar o conteúdo.
                </p>
              </div>
            </div>
          </div>

          {/* Preview de Caracteres */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700">Caracteres</span>
              <span className={cn(
                "text-sm font-semibold",
                formData.descricao.replace(/<[^>]*>/g, '').length > 2000 
                  ? "text-emerald-600" 
                  : formData.descricao.replace(/<[^>]*>/g, '').length > 500
                    ? "text-blue-600"
                    : "text-gray-400"
              )}>
                {formData.descricao.replace(/<[^>]*>/g, '').length}
              </span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className={cn(
                  "h-full transition-all duration-300 rounded-full",
                  formData.descricao.replace(/<[^>]*>/g, '').length > 2000 
                    ? "bg-emerald-500" 
                    : formData.descricao.replace(/<[^>]*>/g, '').length > 500
                      ? "bg-blue-500"
                      : "bg-gray-300"
                )}
                style={{ 
                  width: `${Math.min((formData.descricao.replace(/<[^>]*>/g, '').length / 3000) * 100, 100)}%` 
                }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {formData.descricao.replace(/<[^>]*>/g, '').length < 500 
                ? "Adicione mais detalhes para uma descrição completa"
                : formData.descricao.replace(/<[^>]*>/g, '').length < 2000
                  ? "Boa descrição! Continue adicionando informações"
                  : "Excelente! Descrição bem completa"}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
