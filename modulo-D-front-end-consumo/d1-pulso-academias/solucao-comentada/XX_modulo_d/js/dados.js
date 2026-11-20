/*
 * dados.js – catálogos que quase nunca mudam (unidades, modalidades, instrutores, regras).
 * São baixados UMA vez, em paralelo, e guardados em Map para cruzar pelos ids:
 *   aula.modalidade_id -> modalidades.get(id).nome
 * A API de aulas devolve só os ids de propósito: o cruzamento é trabalho do front-end.
 */
import { api } from './api.js';

export const cat = { unidades: new Map(), modalidades: new Map(), instrutores: new Map(), regras: [] };
let promessa = null;

export function carregarCatalogos() {
  // Guardar a PROMISE (e não só o resultado) evita baixar duas vezes se duas telas pedirem ao mesmo tempo.
  if (!promessa) {
    promessa = Promise.all([api('/unidades'), api('/modalidades'), api('/instrutores'), api('/regras')])
      .then(([u, m, i, r]) => {
        cat.unidades = new Map(u.dados.map((x) => [x.id, x]));
        cat.modalidades = new Map(m.dados.map((x) => [x.id, x]));
        cat.instrutores = new Map(i.dados.map((x) => [x.id, x]));
        cat.regras = r.dados;
        return cat;
      })
      .catch((e) => { promessa = null; throw e; }); // se falhar, a próxima tentativa baixa de novo
  }
  return promessa;
}
