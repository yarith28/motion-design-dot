import {graphEngines} from './graphs.mjs';
import {semanticEngines} from './semantics.mjs';
import {constructionEngines} from './constructions.mjs';
import {evidenceEngines} from './evidence.mjs';
import {councilEngines} from './council.mjs';
export const engines={...graphEngines,...semanticEngines,...constructionEngines,...evidenceEngines,...councilEngines};
