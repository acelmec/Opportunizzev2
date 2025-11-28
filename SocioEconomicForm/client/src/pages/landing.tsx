import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  Users,
  Building2,
  Target,
  BarChart3,
  Clock,
  CheckCircle,
  ArrowRight,
  Zap,
  Lock,
  TrendingUp,
  FileText,
  Bell,
  Smartphone,
  PieChart,
  UserCheck,
  Star,
  Award,
  Sparkles,
} from "lucide-react";

export default function Landing() {
  const features = [
    {
      icon: Users,
      title: "Gestão de Clientes PF/PJ",
      description:
        "Cadastro completo de Pessoa Física e Jurídica com todos os dados sócio-econômicos necessários para análise de risco.",
    },
    {
      icon: Target,
      title: "Scoring Inteligente",
      description:
        "Sistema de pontuação automática que identifica as melhores oportunidades de venda para cada cliente.",
    },
    {
      icon: BarChart3,
      title: "Dashboard Completo",
      description:
        "Visualize KPIs, pipeline de propostas, desempenho da equipe e métricas de conversão em tempo real.",
    },
    {
      icon: Clock,
      title: "Histórico de Interações",
      description:
        "Registre ligações, emails, visitas e propostas. Nunca perca o contexto de um atendimento.",
    },
    {
      icon: Building2,
      title: "Gestão de Patrimônio",
      description:
        "Cadastre veículos, imóveis, embarcações e equipamentos para identificar oportunidades de proteção.",
    },
    {
      icon: FileText,
      title: "Pipeline de Propostas",
      description:
        "Acompanhe cada proposta desde a criação até a emissão da apólice com status em tempo real.",
    },
  ];

  const benefits = [
    { text: "Cadastro sócio-econômico completo", icon: UserCheck },
    { text: "Gestão de patrimônio (veículos, imóveis)", icon: Building2 },
    { text: "Scoring automático por produto", icon: Target },
    { text: "Integração com 45+ seguradoras", icon: Zap },
    { text: "Conformidade total com LGPD", icon: Lock },
    { text: "Dashboard com KPIs em tempo real", icon: PieChart },
    { text: "Histórico completo de interações", icon: Clock },
    { text: "Notificações de renovação", icon: Bell },
  ];

  const stats = [
    { value: "50+", label: "Produtos de Seguro", icon: Shield },
    { value: "45+", label: "Seguradoras Parceiras", icon: Building2 },
    { value: "85%", label: "Taxa de Conversão Média", icon: TrendingUp },
    { value: "100%", label: "Conformidade LGPD", icon: Lock },
  ];

  const plans = [
    {
      name: "Starter",
      price: "Grátis",
      description: "Para corretores autônomos",
      features: ["1 usuário", "1.000 clientes", "500 oportunidades", "Email"],
      highlighted: false,
    },
    {
      name: "Profissional",
      price: "R$ 99/mês",
      description: "Para pequenas corretoras",
      features: ["5 usuários", "5.000 clientes", "2.500 oportunidades", "WhatsApp + Email", "Relatórios"],
      highlighted: true,
    },
    {
      name: "Enterprise",
      price: "R$ 299/mês",
      description: "Para grandes corretoras",
      features: ["10 usuários", "20.000 clientes", "10.000 oportunidades", "Tudo incluso", "API de integração"],
      highlighted: false,
    },
  ];

  const testimonials = [
    {
      name: "Carlos Silva",
      role: "Corretor de Seguros",
      company: "Silva Corretora",
      text: "O SeguroPro transformou minha forma de trabalhar. Agora identifico oportunidades que antes passavam despercebidas.",
    },
    {
      name: "Ana Paula Santos",
      role: "Diretora Comercial",
      company: "Seguros Prime",
      text: "Com o dashboard e os relatórios, nossa equipe aumentou a conversão em 40% no primeiro trimestre.",
    },
    {
      name: "Roberto Oliveira",
      role: "Proprietário",
      company: "RO Corretora",
      text: "A gestão de patrimônio e o scoring automático me ajudam a oferecer o produto certo para cada cliente.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary">
              <Shield className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold" data-testid="text-logo">
              SeguroPro
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild data-testid="button-portal">
              <a href="/portal/login">
                Portal do Cliente
              </a>
            </Button>
            <Button variant="ghost" asChild data-testid="button-login">
              <a href="/login">
                Entrar
              </a>
            </Button>
            <Button asChild data-testid="button-contratar-header">
              <a href="/register">
                Contratar
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="py-20 md:py-32 bg-gradient-to-b from-primary/5 to-background">
          <div className="container mx-auto px-4 text-center">
            <div className="mx-auto max-w-4xl space-y-6">
              <Badge variant="secondary" className="px-4 py-2">
                <Sparkles className="h-4 w-4 mr-2" />
                Plataforma SaaS para Corretoras de Seguros
              </Badge>
              <h1
                className="text-4xl md:text-6xl font-bold tracking-tight"
                data-testid="text-hero-title"
              >
                Aumente suas vendas com{" "}
                <span className="text-primary">Gestão Inteligente</span> de Clientes
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Plataforma completa para cadastro sócio-econômico, gestão de patrimônio, 
                scoring de oportunidades e acompanhamento de propostas. Tudo o que sua 
                corretora precisa para vender mais.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
                <Button size="lg" asChild data-testid="button-contratar-hero">
                  <a href="/register">
                    Começar Gratuitamente
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
                <Button size="lg" variant="outline" asChild data-testid="button-login-hero">
                  <a href="/login">
                    Já tenho conta
                  </a>
                </Button>
              </div>
              <p className="text-sm text-muted-foreground pt-2">
                Plano Starter gratuito para sempre. Sem cartão de crédito.
              </p>
            </div>
          </div>
        </section>

        <section className="py-12 border-y bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center" data-testid={`stat-${index}`}>
                  <div className="flex justify-center mb-2">
                    <stat.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-3xl md:text-4xl font-bold font-mono text-primary">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20" id="funcionalidades">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <Badge variant="outline" className="mb-4">Funcionalidades</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Tudo que sua corretora precisa
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Ferramentas poderosas para gerenciar clientes, identificar oportunidades 
                e aumentar suas vendas de seguros.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <Card
                  key={index}
                  className="hover-elevate transition-all"
                  data-testid={`card-feature-${index}`}
                >
                  <CardHeader>
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">{feature.description}</CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <Badge variant="outline">Benefícios</Badge>
                <h2 className="text-3xl md:text-4xl font-bold">
                  Identifique as Melhores Oportunidades de Venda
                </h2>
                <p className="text-muted-foreground text-lg">
                  Nosso sistema analisa automaticamente o perfil de cada cliente
                  e calcula scores de oportunidade para mais de 50 produtos de
                  seguro, ajudando você a oferecer a proteção certa.
                </p>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {benefits.map((benefit, index) => (
                    <li
                      key={index}
                      className="flex items-center gap-3"
                      data-testid={`benefit-${index}`}
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                        <benefit.icon className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-sm">{benefit.text}</span>
                    </li>
                  ))}
                </ul>
                <Button size="lg" asChild className="mt-4">
                  <a href="#planos" data-testid="button-contratar-benefits">
                    Ver Planos
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Card className="col-span-2">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                        <TrendingUp className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <div className="text-3xl font-bold font-mono">+40%</div>
                        <div className="text-sm text-muted-foreground">
                          Aumento médio em conversões
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center text-center">
                      <Users className="h-8 w-8 text-primary mb-2" />
                      <div className="text-2xl font-bold font-mono">PF</div>
                      <div className="text-xs text-muted-foreground">
                        Pessoas Físicas
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center text-center">
                      <Building2 className="h-8 w-8 text-chart-2 mb-2" />
                      <div className="text-2xl font-bold font-mono">PJ</div>
                      <div className="text-xs text-muted-foreground">
                        Pessoas Jurídicas
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20" id="planos">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <Badge variant="outline" className="mb-4">Planos</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Escolha o plano ideal para sua corretora
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Comece gratuitamente e evolua conforme sua corretora cresce.
                Sem surpresas, sem taxas escondidas.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {plans.map((plan, index) => (
                <Card
                  key={index}
                  className={`relative ${plan.highlighted ? "border-primary shadow-lg scale-105" : ""}`}
                  data-testid={`card-plan-${index}`}
                >
                  {plan.highlighted && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary">
                        <Star className="h-3 w-3 mr-1" />
                        Mais Popular
                      </Badge>
                    </div>
                  )}
                  <CardHeader className="text-center pb-2">
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                    <div className="pt-4">
                      <span className="text-4xl font-bold">{plan.price}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="space-y-2">
                      {plan.features.map((feature, fIndex) => (
                        <li key={fIndex} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Button 
                      className="w-full" 
                      variant={plan.highlighted ? "default" : "outline"}
                      asChild
                    >
                      <a href="/register" data-testid={`button-plan-${index}`}>
                        Começar Agora
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <Badge variant="outline" className="mb-4">Depoimentos</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                O que nossos clientes dizem
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {testimonials.map((testimonial, index) => (
                <Card key={index} data-testid={`card-testimonial-${index}`}>
                  <CardContent className="pt-6">
                    <div className="flex gap-1 mb-4">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-muted-foreground mb-4 italic">
                      "{testimonial.text}"
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                        {testimonial.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-sm">{testimonial.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {testimonial.role} - {testimonial.company}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <Award className="h-12 w-12 mx-auto mb-6 opacity-80" />
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Pronto para transformar sua corretora?
            </h2>
            <p className="text-primary-foreground/80 max-w-xl mx-auto mb-8 text-lg">
              Junte-se a centenas de corretoras que já estão vendendo mais com o SeguroPro.
              Comece gratuitamente hoje mesmo.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                variant="secondary"
                asChild
                data-testid="button-contratar-cta"
              >
                <a href="/register">
                  Criar Conta Grátis
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
                asChild
                data-testid="button-login-cta"
              >
                <a href="/login">
                  Fazer Login
                </a>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-12 bg-card/50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Shield className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold">SeguroPro</span>
              </div>
              <p className="text-sm text-muted-foreground">
                A plataforma completa para gestão de corretoras de seguros.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Produto</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#funcionalidades" className="hover:text-foreground">Funcionalidades</a></li>
                <li><a href="#planos" className="hover:text-foreground">Planos e Preços</a></li>
                <li><a href="/register" className="hover:text-foreground">Começar Grátis</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Suporte</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">Central de Ajuda</a></li>
                <li><a href="#" className="hover:text-foreground">Contato</a></li>
                <li><a href="#" className="hover:text-foreground">Status do Sistema</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">Termos de Uso</a></li>
                <li><a href="#" className="hover:text-foreground">Política de Privacidade</a></li>
                <li><a href="#" className="hover:text-foreground">LGPD</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} SeguroPro. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
