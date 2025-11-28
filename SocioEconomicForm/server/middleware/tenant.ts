import type { Request, Response, NextFunction, RequestHandler } from "express";
import { storage } from "../storage";
import type { User } from "@shared/schema";

declare global {
  namespace Express {
    interface Request {
      tenantId?: string;
      userRole?: string;
      currentUser?: User;
    }
  }
}

export const withTenantContext: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return next();
    }
    
    const userId = (req as any).user?.claims?.sub;
    if (!userId) {
      return next();
    }

    const user = await storage.getUser(userId);
    if (!user) {
      return next();
    }

    req.currentUser = user;
    req.userRole = user.role || "corretor";
    req.tenantId = user.tenantId || undefined;

    next();
  } catch (error) {
    console.error("Error in tenant context middleware:", error);
    next(error);
  }
};

export const requireTenant: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  if (!req.tenantId) {
    return res.status(403).json({ message: "Acesso negado: usuário não pertence a uma corretora" });
  }
  next();
};

export const requireRole = (...allowedRoles: string[]): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.userRole;
    if (!userRole || !allowedRoles.includes(userRole)) {
      return res.status(403).json({ message: "Acesso negado: permissão insuficiente" });
    }
    next();
  };
};

export const isSaasAdmin: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  if (req.userRole !== "saas_admin") {
    return res.status(403).json({ message: "Acesso negado: apenas administradores SaaS" });
  }
  next();
};

export const isTenantAdmin: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  if (!["saas_admin", "tenant_admin"].includes(req.userRole || "")) {
    return res.status(403).json({ message: "Acesso negado: apenas administradores" });
  }
  next();
};

export const isCorretorOrAdmin: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  const allowedRoles = ["saas_admin", "tenant_admin", "corretor"];
  if (!allowedRoles.includes(req.userRole || "")) {
    return res.status(403).json({ message: "Acesso negado: permissão insuficiente para esta operação" });
  }
  next();
};
