'use client'

import { useEffect, useRef, useState } from 'react'
import * as Blockly from 'blockly'

type BlocklyPlaygroundProps = {
  keywords?: string[]
  onApply?: (answer: string) => void
}

const STEP_OPTIONS: Array<[string, string]> = [
  ['вверх', 'вверх'],
  ['вниз', 'вниз'],
  ['влево', 'влево'],
  ['вправо', 'вправо'],
  ['вперёд', 'вперёд'],
  ['поворот', 'поворот'],
  ['встать', 'встать'],
  ['почистить зубы', 'почистить'],
  ['завтрак', 'завтрак'],
  ['хлеб', 'хлеб'],
  ['тостер', 'тостер'],
  ['привет', 'привет'],
  ['мир', 'мир'],
]

function ensureJuniorBlocksRegistered() {
  if (Blockly.Blocks.cq_step && Blockly.Blocks.cq_phrase && Blockly.Blocks.cq_repeat) return

  Blockly.defineBlocksWithJsonArray([
    {
      type: 'cq_step',
      message0: 'шаг %1',
      args0: [
        {
          type: 'field_dropdown',
          name: 'STEP',
          options: STEP_OPTIONS,
        },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: 205,
      tooltip: 'Один шаг алгоритма',
      helpUrl: '',
    },
    {
      type: 'cq_phrase',
      message0: 'фраза %1',
      args0: [
        {
          type: 'field_input',
          name: 'TEXT',
          text: 'вверх, вверх, вправо',
        },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: 120,
      tooltip: 'Добавь свой текст',
      helpUrl: '',
    },
    {
      type: 'cq_repeat',
      message0: 'повторить %1 раз',
      args0: [
        {
          type: 'field_number',
          name: 'COUNT',
          value: 2,
          min: 1,
          max: 10,
          precision: 1,
        },
      ],
      message1: 'сделать %1',
      args1: [
        {
          type: 'input_statement',
          name: 'DO',
        },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: 18,
      tooltip: 'Повторяет вложенные шаги',
      helpUrl: '',
    },
  ])

}

function collectLinesFromChain(start: Blockly.Block | null): string[] {
  const lines: string[] = []
  let current = start

  while (current) {
    if (current.type === 'cq_step') {
      const step = (current.getFieldValue('STEP') || '').trim()
      if (step) lines.push(step)
    } else if (current.type === 'cq_phrase') {
      const phrase = (current.getFieldValue('TEXT') || '').trim()
      if (phrase) lines.push(phrase)
    } else if (current.type === 'cq_repeat') {
      const count = Number(current.getFieldValue('COUNT'))
      const repeatCount = Number.isFinite(count) ? Math.max(1, Math.min(10, Math.round(count))) : 1
      const nested = collectLinesFromChain(current.getInputTargetBlock('DO'))
      for (let index = 0; index < repeatCount; index += 1) {
        lines.push(...nested)
      }
    }
    current = current.getNextBlock()
  }

  return lines
}

function workspaceToAnswer(workspace: Blockly.WorkspaceSvg): string {
  const topBlocks = workspace.getTopBlocks(true)
  const lines = topBlocks.flatMap((block) => collectLinesFromChain(block))
  return lines.join('\n').trim()
}

function spawnBlock(workspace: Blockly.WorkspaceSvg, type: 'cq_step' | 'cq_repeat' | 'cq_phrase') {
  const block = workspace.newBlock(type)
  block.initSvg()
  block.render()
  const offset = workspace.getTopBlocks(false).length * 72
  block.moveBy(24, 24 + offset)
}

export function BlocklyPlayground({ keywords = [], onApply }: BlocklyPlaygroundProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const workspaceRef = useRef<Blockly.WorkspaceSvg | null>(null)
  const [generatedAnswer, setGeneratedAnswer] = useState('')

  useEffect(() => {
    ensureJuniorBlocksRegistered()
    if (!containerRef.current) return

    const workspace = Blockly.inject(containerRef.current, {
      trashcan: true,
      move: { drag: true, wheel: true, scrollbars: true },
      zoom: { controls: true, wheel: true, startScale: 1, minScale: 0.7, maxScale: 1.8 },
      grid: { spacing: 20, length: 3, colour: '#dbeafe', snap: true },
    })
    workspaceRef.current = workspace
    Blockly.svgResize(workspace)

    const handleResize = () => Blockly.svgResize(workspace)
    window.addEventListener('resize', handleResize)

    // Надежный fallback: даже если toolbox не отрисовался, у ученика сразу есть блоки.
    spawnBlock(workspace, 'cq_step')
    spawnBlock(workspace, 'cq_repeat')
    spawnBlock(workspace, 'cq_phrase')

    const updateAnswer = () => {
      try {
        setGeneratedAnswer(workspaceToAnswer(workspace))
      } catch {
        setGeneratedAnswer('')
      }
    }

    workspace.addChangeListener(updateAnswer)
    updateAnswer()

    return () => {
      window.removeEventListener('resize', handleResize)
      workspaceRef.current = null
      workspace.dispose()
    }
  }, [])

  const canApply = generatedAnswer.trim().length > 0

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_0.9fr]">
      <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white p-2">
        <div ref={containerRef} style={{ minHeight: 320, width: '100%' }} />
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => workspaceRef.current && spawnBlock(workspaceRef.current, 'cq_step')}
          className="rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700"
        >
          Добавить шаг
        </button>
        <button
          type="button"
          onClick={() => workspaceRef.current && spawnBlock(workspaceRef.current, 'cq_repeat')}
          className="rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700"
        >
          Добавить повтор
        </button>
        <button
          type="button"
          onClick={() => workspaceRef.current && spawnBlock(workspaceRef.current, 'cq_phrase')}
          className="rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700"
        >
          Добавить фразу
        </button>
      </div>

      <div className="space-y-3">
        {keywords.length > 0 && (
          <div className="rounded-[20px] border border-sky-100 bg-sky-50 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-700">Ключевые слова</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {keywords.map((keyword) => (
                <span key={keyword} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-sky-700">
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        )}

        <pre className="min-h-[220px] overflow-auto rounded-[24px] bg-slate-950 p-4 text-xs leading-6 text-emerald-200">
          {generatedAnswer || 'Собери алгоритм из блоков, и здесь появится твой ответ.'}
        </pre>

        <button
          type="button"
          disabled={!canApply}
          onClick={() => onApply?.(generatedAnswer)}
          className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          Вставить в ответ
        </button>
      </div>
    </div>
  )
}
