"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { getUserPermissions } from "@/lib/supabase/user-permissions"
import { logger } from "@/lib/utils/logger"

interface OrganizationUser {
  id: string
  user_id: string
  user?: {
    email?: string
    full_name?: string
  } | null
  email?: string
}

interface DeleteUserDialogProps {
  user: OrganizationUser | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function DeleteUserDialog({ 
  user, 
  open, 
  onOpenChange, 
  onSuccess 
}: DeleteUserDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!user) return
    
    setIsDeleting(true)
    try {
      const supabase = createClient()
      
      // Verificar permissão
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (currentUser) {
        const permissions = await getUserPermissions(supabase, currentUser.id)
        if (!permissions?.can_delete && !permissions?.is_primary) {
          toast.error("Você não tem permissão para remover usuários")
          setIsDeleting(false)
          return
        }
      }

      logger.log("🗑️ [DELETE USER] Deletando usuário:", user.id)
      
      const { error } = await supabase
        .from("organization_users")
        .delete()
        .eq("id", user.id)
      
      if (error) {
        logger.error("❌ [DELETE USER] Erro:", error)
        toast.error("Erro ao remover usuário: " + error.message)
      } else {
        logger.log("✅ [DELETE USER] Usuário removido com sucesso")
        toast.success("Usuário removido com sucesso!")
        onOpenChange(false)
        onSuccess()
      }
    } catch (error: any) {
      logger.error("❌ [DELETE USER] Erro:", error)
      toast.error("Erro ao remover usuário: " + error.message)
    } finally {
      setIsDeleting(false)
    }
  }

  const userEmail = user?.user?.email || user?.email || "este usuário"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remover Usuário</DialogTitle>
          <DialogDescription>
            Tem certeza que deseja remover <strong>{userEmail}</strong> da organização? Esta ação não pode ser desfeita.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)} 
            disabled={isDeleting}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            disabled={isDeleting}
            onClick={handleDelete}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Removendo...
              </>
            ) : (
              'Sim, remover'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

