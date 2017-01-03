import { IModelService } from "vs/editor/common/services/modelService";
import { IModeService } from "vs/editor/common/services/modeService";
import { ITextModelResolverService } from "vs/editor/common/services/resolverService";
import { ServiceCollection } from "vs/platform/instantiation/common/serviceCollection";
import { EditorGroupsControl } from "vs/workbench/browser/parts/editor/editorGroupsControl";
import { FileRenderer } from "vs/workbench/parts/files/browser/views/explorerViewer";

import { layout } from "sourcegraph/components/utils";
import { TextModelContentProvider } from "sourcegraph/editor/resolverService";

// Set the height of files in the file tree explorer.
(FileRenderer as any).ITEM_HEIGHT = 30;

// Set the height of the blob title.
(EditorGroupsControl as any).EDITOR_TITLE_HEIGHT = layout.editorToolbarHeight;

// Workbench overwrites a few services, so we add these services after startup.
export function configurePostStartup(services: ServiceCollection): void {
	const resolver = services.get(ITextModelResolverService) as ITextModelResolverService;
	resolver.registerTextModelContentProvider("git", new TextModelContentProvider(
		services.get(IModelService) as IModelService,
		services.get(IModeService) as IModeService,
	));
}
