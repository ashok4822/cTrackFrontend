import { useState, useEffect } from "react";
import { billingService } from "@/services/billingService";
import { useToast } from "@/hooks/use-toast";

export function useOverdueStatus() {
  const [hasOverdueBills, setHasOverdueBills] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const { toast } = useToast();

  useEffect(() => {
    const checkStatus = async () => {
      try {
        setLoading(true);
        const { hasOverdueBills } = await billingService.fetchOverdueStatus();
        setHasOverdueBills(hasOverdueBills);
      } catch (error) {
        console.error("Failed to check overdue status", error);
        // Default to false on error to prevent accidental blocking of valid users, 
        // though backend will still block API requests
        setHasOverdueBills(false);
      } finally {
        setLoading(false);
      }
    };

    checkStatus();
  }, [toast]);

  return { hasOverdueBills, loading };
}
