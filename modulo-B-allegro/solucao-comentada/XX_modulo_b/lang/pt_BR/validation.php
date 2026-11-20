<?php

// Mensagens de validação em português.
// O Laravel procura este arquivo porque o .env tem APP_LOCALE=pt_BR.
// Dica de prova: escreva só as regras que você usa; não precisa do arquivo inteiro.
return [
    'required' => 'O campo :attribute é obrigatório.',
    'required_if' => 'O campo :attribute é obrigatório quando :other é :value.',
    'string' => 'O campo :attribute deve ser um texto.',
    'integer' => 'O campo :attribute deve ser um número inteiro.',
    'numeric' => 'O campo :attribute deve ser um número.',
    'decimal' => 'O campo :attribute deve ter no máximo :decimal casas decimais.',
    'boolean' => 'O campo :attribute deve ser verdadeiro ou falso.',
    'array' => 'O campo :attribute deve ser uma lista.',
    'email' => 'O campo :attribute deve ser um e-mail válido.',
    'date' => 'O campo :attribute deve ser uma data válida.',
    'date_format' => 'O campo :attribute deve estar no formato :format.',
    'after_or_equal' => 'O campo :attribute deve ser uma data igual ou posterior a :date.',
    'before_or_equal' => 'O campo :attribute deve ser uma data igual ou anterior a :date.',
    'after' => 'O campo :attribute deve ser posterior a :date.',
    'in' => 'O valor escolhido em :attribute é inválido.',
    'exists' => 'O valor escolhido em :attribute não existe.',
    'unique' => 'Já existe um registro com este :attribute.',
    'regex' => 'O formato de :attribute é inválido.',
    'digits_between' => 'O campo :attribute deve ter entre :min e :max dígitos.',
    'gt' => ['numeric' => 'O campo :attribute deve ser maior que :value.'],
    'gte' => ['numeric' => 'O campo :attribute deve ser maior ou igual a :value.'],
    'image' => 'O arquivo :attribute deve ser uma imagem.',
    'mimes' => 'O arquivo :attribute deve ser do tipo: :values.',
    'uploaded' => 'Não foi possível enviar :attribute (arquivo grande demais?).',
    'min' => [
        'numeric' => 'O campo :attribute deve ser no mínimo :min.',
        'string' => 'O campo :attribute deve ter no mínimo :min caracteres.',
        'array' => 'Escolha pelo menos :min item(ns) em :attribute.',
        'file' => 'O arquivo :attribute deve ter no mínimo :min KB.',
    ],
    'max' => [
        'numeric' => 'O campo :attribute deve ser no máximo :max.',
        'string' => 'O campo :attribute deve ter no máximo :max caracteres.',
        'array' => 'Escolha no máximo :max item(ns) em :attribute.',
        'file' => 'O arquivo :attribute deve ter no máximo :max KB.',
    ],
    'between' => ['numeric' => 'O campo :attribute deve estar entre :min e :max.'],

    // nomes amigáveis dos campos (aparecem no lugar de :attribute)
    'attributes' => [
        'name' => 'nome', 'email' => 'e-mail', 'password' => 'senha', 'cpf' => 'CPF', 'phone' => 'telefone',
        'plate' => 'placa', 'brand' => 'marca', 'model' => 'modelo', 'year' => 'ano', 'price' => 'preço',
        'vehicle_id' => 'veículo', 'mechanic_id' => 'mecânico', 'km' => 'quilometragem', 'complaint' => 'relato do cliente',
        'due_date' => 'prazo de entrega', 'services' => 'serviços', 'services.*' => 'serviço', 'part_id' => 'peça',
        'quantity' => 'quantidade', 'fotos' => 'fotos', 'fotos.*' => 'foto', 'note' => 'observação', 'status' => 'situação',
        'birth_date' => 'data de nascimento', 'guardian_name' => 'nome do responsável', 'instrument_id' => 'instrumento',
        'teacher_id' => 'professor(a)', 'weekday' => 'dia da semana', 'start_time' => 'horário de início',
        'end_time' => 'horário de término', 'capacity' => 'vagas', 'monthly_fee' => 'mensalidade', 'level' => 'nível',
        'student_id' => 'aluno', 'school_class_id' => 'turma', 'paid_at' => 'data do pagamento', 'code' => 'código',
        'reason' => 'motivo',
    ],
];
