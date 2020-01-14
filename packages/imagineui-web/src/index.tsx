import React, {render, useCallback, useState, useEffect, useContext} from 'preact/compat';
import {Wireframe} from "imagineui-core/src/wireframe";
import {parseSceneToAST, ParseValue} from "imagineui-core/src/parse/ast";
import './index.css';
import {Editor} from "./editor";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api"
import {MarkerSeverity} from "monaco-editor";
import {StateProvider, WireframeActionTypes, wireframeContext} from "imagineui-core/src/nlp/nlp-store";
import {initRussianNLP} from "imagineui-core/src/nlp/nlp-ru_RU";

const Playground = () => {
    const { dispatch } = useContext(wireframeContext)
    useEffect(() => {
        initRussianNLP().then(nlp => {
            dispatch({type: WireframeActionTypes.SET_NLP, nlp})
        }).catch(console.error)
    }, [dispatch])

    const [sceneAST, setSceneAST] = useState<ParseValue | null>(null)
    const onChange = useCallback((ev: monaco.editor.IModelContentChangedEvent, editor: monaco.editor.IStandaloneCodeEditor) => {
        // TODO: Consider incremental compilation with ev.changes to speed up the parsing/rendering
        // TODO: Move the parsing code to the Monaco Editor Worker
        try {
            const ast = parseSceneToAST(editor.getValue() + '\n')

            if(ast.lexErrors) {
                monaco.editor.setModelMarkers(editor.getModel()!, 'imagineui', ast.lexErrors.map((error) => ({
                    severity: MarkerSeverity.Error,
                    message: error.message,
                    startColumn: error.column || 0,
                    startLineNumber: error.line || 0,
                    endLineNumber: error.line + error.length || 0,
                    endColumn: error.column || 0,
                })))

                console.error(ast)
            }
            if(ast.parseErrors) {
                monaco.editor.setModelMarkers(editor.getModel()!, 'imagineui', ast.parseErrors.map((error) => ({
                    severity: MarkerSeverity.Error,
                    message: error.message,
                    startColumn: error.token.startColumn || 0,
                    startLineNumber: error.token.startLine || 0,
                    endLineNumber: error.token.endLine || 0,
                    endColumn: error.token.endColumn || 0,
                })))

                console.error(ast)
            }

            if (!ast.lexErrors && !ast.parseErrors && ast.value) {
                monaco.editor.setModelMarkers(editor.getModel()!, 'imagineui', [])
                setSceneAST(ast.value)
            }
        } catch (e) {
            console.error(e)
        }
    }, [setSceneAST])

    return <div className="playground">
        <Editor onChange={onChange}/>
        <Wireframe className="wireframe" sceneDescription={sceneAST}/>
    </div>
}

render(<StateProvider><Playground/></StateProvider>, document.getElementById('root')!);
