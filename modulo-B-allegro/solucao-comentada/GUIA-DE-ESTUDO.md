# Allegro · guia de estudo da solução

Material de revisão do Eduardo · Módulo B (Back-end MVC em Laravel) · Raul Porto Lopes (Avaliador)

Leia com o projeto aberto no VS Code. Cada passo diz **o que o enunciado pede**, **onde está na solução** e **a armadilha** que custa ponto. A ordem é a ordem de ataque que eu usaria nas 4 horas.

---

## 0. Os 30 minutos de leitura

Esta prova parece um CRUD de turmas e alunos, mas quase metade dos pontos está em **regra de estado**: turma cheia vai para a espera, cancelar promove alguém, mensalidade vencida tem multa, quem pode o quê. Marque no enunciado tudo que tem "não pode", "só", "quando", "403" e "calculado no servidor".

Ordem de ataque:

| Bloco | Tempo | Por quê |
|---|---|---|
| 1. Projeto em /XX_modulo_b, login, logout, layout | 25 min | Sem isso nada é avaliado |
| 2. Models, relações e o `Formato` | 15 min | Tudo depende deles |
| 3. Permissões (Gates e Policy) | 20 min | Muitos pontos, pouco código |
| 4. Listagem e detalhe de turmas | 25 min | Pontos rápidos |
| 5. Cadastro de turma com conflitos | 35 min | Maior bloco de validação |
| 6. Alunos | 25 min | CRUD conhecido + idade |
| 7. Matrículas, espera e cancelamento | 40 min | Maior subcritério (7 pt) |
| 8. Mensalidades e pagamento | 30 min | Cálculo no servidor |
| 9. Inadimplência, painel, CSV | 15 min | Rápidos |
| 10. Testar pelo roteiro e publicar | 10 min | Congelar código novo |

---

## 1. Projeto, login e layout

Igual à Garagem 47 (veja o guia dela): `index.php` + `.htaccess` na raiz, `AuthController@entrar` com `Hash::check()` para dar a mensagem de inativo, grupo `middleware('auth')` e logout por **POST** com `@csrf`.

## 2. Models e relações

```php
// SchoolClass (tabela school_classes: o nome "Class" é palavra reservada do PHP)
public function teacher()     { return $this->belongsTo(User::class, 'teacher_id'); }
public function enrollments() { return $this->hasMany(Enrollment::class); }
public function ativas()      { return $this->enrollments()->where('status', 'ativa'); }
public function espera()      { return $this->enrollments()->where('status', 'espera')->orderBy('waitlisted_at')->orderBy('id'); }
```

- `ativas()` e `espera()` são relações com filtro. Com elas, `withCount('ativas')` dá a ocupação da listagem sem N+1.
- Não precisa de `protected $table`: o Laravel transforma `SchoolClass` em `school_classes`, `Enrollment` em `enrollments` e `Invoice` em `invoices` sozinho.
- `Student::invoices()` é um `hasManyThrough(Invoice::class, Enrollment::class)`: as mensalidades do aluno passando pelas matrículas.
- `casts()`: `birth_date`, `enrolled_at`, `due_date`, `paid_at` e `reference_month` como `date`. Sem isso, `->format('d/m/Y')` e `->lt(today())` quebram.
- `start_time` vem do banco como `18:00:00`. Os métodos `inicio()` e `fim()` cortam para `18:00` com `substr(..., 0, 5)`, e `horario()` monta `Segunda, 18:00–19:30`.

## 3. Permissões

```php
// AppServiceProvider
Gate::define('alunos',      fn (User $u) => $u->ehAdministrativo());  // secretaria ou coordenação
Gate::define('financeiro',  fn (User $u) => $u->ehAdministrativo());
Gate::define('coordenacao', fn (User $u) => $u->ehCoordenacao());
```

- Nas rotas: `Route::middleware('can:alunos')->group(...)`. Isso já devolve **403** para o professor em qualquer rota de aluno.
- Turma usa **Policy** porque depende do registro: `view()` deixa o professor ver só `teacher_id === $user->id`. No controller: `$this->authorize('view', $turma)`.
- A listagem do professor usa o scope `visiveisPara($user)`, que acrescenta `where('teacher_id', ...)`. **Esconder na listagem não basta**: sem a Policy, `/turmas/3` abre para a Marta.
- Botões: `@can('update', $turma)`, `@can('coordenacao')`. A coluna de mensalidade some com `@unless (auth()->user()->ehProfessor())`.

**Armadilha:** 404 vem de graça com route model binding (`SchoolClass $turma`). Se você fizer `SchoolClass::find($id)` na mão e não tratar o `null`, dá 500.

## 4. Listagem e detalhe de turmas

- Ordem: `orderBy('weekday')->orderBy('start_time')->orderBy('code')`.
- Filtros com `->when(...)`. Valide o valor antes (`ctype_digit`, `array_key_exists`) para a URL com lixo não quebrar.
- "Só com vaga": turma ativa **e** ativos < vagas. Como `ativas_count` é calculado no SELECT, não dá para usar no `where`; a solução usa um `whereRaw` com subconsulta. Alternativa aceita: `having('ativas_count', '<', DB::raw('capacity'))`.
- Lista de espera na ordem de **chegada** (`waitlisted_at`), nunca por nome. A posição é `$loop->iteration`.

## 5. Cadastro de turma e conflitos

A regra de sobreposição de intervalos é a mesma da Via Certa e vale para a prova inteira:

```php
// SchoolClass::scopeSobrepoe — começa antes de o outro terminar E termina depois de o outro começar
return $q->where('weekday', $dia)->where('start_time', '<', $fim)->where('end_time', '>', $inicio);
```

- `<` e `>` estritos: 18:00–19:30 e 19:30–20:30 **não** conflitam (encostam).
- `Grade::conflitos()` devolve **todas** as mensagens (sala e professor) e só compara com turmas **ativas**. Na edição, ignora a própria turma (`where('id', '!=', $turma->id)`).
- Validações que dependem de vários campos ou do banco ficam no `after()` do Form Request: duração de 30 a 180 min, vagas ≤ capacidade da sala, vagas ≥ ativos, não desativar com matrícula ativa ou em espera, conflitos.
- `prepareForValidation()`: código em maiúsculas e `Formato::numeroDigitado('1.250,00')` → `1250.00` antes do `numeric`.
- `teacher_id`: `Rule::exists('users', 'id')->where('role', 'professor')->where('active', 1)`.

**Armadilha:** mudar a mensalidade da turma **não** muda as mensalidades já geradas. Na solução isso sai de graça porque `invoices.amount` é gravado na geração. Quem calcular o valor da mensalidade lendo `turma->monthly_fee` na hora de exibir perde o ponto.

## 6. Alunos

- Idade pela data completa: `$this->birth_date->diffInYears(today())`. Quem nasceu em 20/11/2008 faz 18 em 20/11/2026: **já é maior**. Fazer `date('Y') - ano` erra para quem ainda não fez aniversário.
- Responsável obrigatório para menor: `required_if` não calcula idade, então:

```php
$limiteMaior = Carbon::today()->subYears(18)->toDateString();
$menor = $this->birth_date > $limiteMaior;          // nasceu depois = ainda não fez 18
'guardian_name' => [Rule::requiredIf($menor), 'nullable', 'string', 'max:100'],
```

- Pelo menos 5 anos: `before_or_equal:` + `today()->subYears(5)`.
- "Só em débito": `whereHas('invoices', fn ($i) => $i->whereNull('paid_at')->whereDate('due_date', '<', today()))`. A relação `Student::invoices()` é um `hasManyThrough` via `enrollments`.
- Filtro por turma: só matrícula **ativa** (`whereHas('enrollments', ... ->where('status', 'ativa'))`).
- Apagar com matrícula (qualquer uma): teste `$aluno->enrollments()->exists()` e volte com mensagem. A FK é RESTRICT: sem o teste, dá erro 500 de integridade.

## 7. Matrículas, espera e cancelamento

Tudo em `app/Services/Matriculas.php`. Ler este arquivo inteiro é o melhor estudo da prova.

1. **Antes de gravar** (`problema()`): turma inativa → já ativo / já na espera (mensagens diferentes) → conflito de horário com outra turma em que o aluno está **ativo**.
2. **Gravar** (`matricular()`): dentro de `DB::transaction` com `lockForUpdate()` na turma. Conta os ativos: se tem vaga, `ativa` + `enrolled_at = hoje` + mensalidades; se não, `espera` + `waitlisted_at = now()` e **nenhuma** mensalidade.
3. **Mensalidades** (`gerarMensalidades()`): do mês atual até dezembro, vencimento dia 10. Se o dia 10 já chegou, a primeira vence hoje + 5.

```php
$vencimento = $mes->copy()->day(10);
if ($primeira && $vencimento->lte($hoje)) $vencimento = $hoje->copy()->addDays(5);
```

4. **Cancelar** (`cancelar()`): `status = cancelada` (não apaga a linha!), apaga só as mensalidades **em aberto que vencem hoje ou depois**. Paga fica (histórico); vencida não paga fica (é dívida).
5. **Promover** (`promoverDaEspera()`): percorre a espera em ordem de chegada e promove o **primeiro sem conflito**. Quem tem conflito continua esperando. Só promove se a matrícula cancelada era ativa.

**Armadilhas:**
- Contar a espera como ocupação: a turma fica "cheia" antes da hora.
- Promover o primeiro da fila sem checar conflito: a Carolina tem aula na VIO-BAS-SEG18 às 18:00–19:30 e não pode entrar na VLN-BAS-SEG19 às 19:00.
- Apagar todas as mensalidades no cancelamento: some a dívida do aluno e o relatório de inadimplência erra.

## 8. Mensalidades e pagamento

A situação **não** é coluna: é calculada pela data.

```php
public function situacao(): string {
    if ($this->paid_at) return 'paga';
    return $this->due_date->lt(today()) ? 'vencida' : 'aberta';
}
public function valorAtualizado(?Carbon $em = null): float {
    $dias = $this->diasDeAtraso($em);                    // pagar NO vencimento = 0 dias
    if ($dias === 0) return round($this->amount, 2);
    return round($this->amount * (1 + 0.02 + 0.01 * $dias / 30), 2);
}
```

- Para filtrar no banco, o mesmo critério vira scope: `scopeNaSituacao('vencida')` = `whereNull('paid_at')->whereDate('due_date', '<', today())`.
- **Totais**: sobre TODAS as linhas filtradas. Clone a consulta antes de paginar: `(clone $base)->get()` para os totais e `$base->paginate(15)->withQueryString()` para a tabela.
- Filtro de mês: `<input type="month">` manda `2026-11`. Compare com `whereDate('reference_month', '2026-11-01')`.
- **Pagamento**: o formulário manda só a data. Valide `before_or_equal:today` e `after_or_equal:` a data da matrícula. O valor é `valorAtualizado(Carbon::parse($request->paid_at))`. **Nunca** leia `paid_amount` do request: o avaliador manda pelo DevTools.
- Já paga: volte com mensagem antes de validar. Estorno: só coordenação (rota no grupo `can:coordenacao`), zera `paid_at` e `paid_amount`.

## 9. Inadimplência, painel e CSV

- Inadimplência: pegue as vencidas, `groupBy` por aluno na coleção e calcule quantidade, mínimo do vencimento, soma original e soma atualizada. Ordem pelo **atualizado** (não pelo original), desempate pelo nome: `sortBy([['atualizado', 'desc'], fn ($a, $b) => strcmp(...)])`.
- Painel do professor: `Carbon::today()->dayOfWeekIso` dá 1 = segunda, igual à coluna `weekday`.
- "Recebido em mm/aaaa": soma de `paid_amount` com `paid_at` no mês. Só a coordenação vê (`@isset` no Blade porque o controller só manda para ela).
- CSV: `streamDownload`, `fwrite($out, "\xEF\xBB\xBF")` (BOM) e `fputcsv($out, $linha, ';')`. Reaproveite a mesma consulta dos filtros (`consulta($f)`), sem paginar.

## 10. Checklist final (10 min)

- [ ] Abrir `/XX_modulo_b/` sem `/public`; `.env` dá 403.
- [ ] Logar com os 3 cargos e abrir cada rota proibida: 403 na aba Network.
- [ ] Matricular numa turma cheia (VLN-BAS-SEG19) e ver a posição.
- [ ] Cancelar o Caio Fonseca na VLN-BAS-SEG19: entra o Gustavo, não a Carolina.
- [ ] Pagar uma mensalidade vencida com data de 15 dias depois do vencimento: R$ 200,00 → R$ 205,00.
- [ ] README com instalação e usuários.
