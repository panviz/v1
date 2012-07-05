Class.create("Ls", Action, {
	execute : function(){
		var path;					
		if(window.actionArguments && window.actionArguments.length>0){
			path = window.actionArguments[0];
			if(Object.isString(path)){
				path = new Item(path, {"isLeaf" : false, "label" : getBaseName(path)});
			}
		}else{
			userSelection = app.getUserSelection();
			if(userSelection && userSelection.isUnique() && (userSelection.hasDir() || userSelection.hasMime("MIMES_ZIP".split(",")))){
				path = userSelection.getUniqueNode();
			}
		}
		if(path){
			app.updateContextData(path);
		}						
	}
}

Class.create("Upload", Action, {
	execute : function(){
		var uploaders = app.getActiveExtensionByType("uploader");
		if(uploaders.length){
			var uploader = uploaders[0];
			if(app.actionBar.getAction("trigger_remote_copy")){
											$modal.setCloseAction(function(){
													app.fireContextRefresh();
													var bgManager = app.actionBar.bgManager;
													bgManager.queueAction("trigger_remote_copy", new Hash(), "Copying files to server");
													bgManager.next();
											});
			}
			if(uploader.dialogOnOpen){
				uploader.resourcesManager.load();
				var dialogOnOpen = new Function("oForm", uploader.dialogOnOpen);
			}
			if(uploader.dialogOnComplete){
				uploader.resourcesManager.load();
				var dialogOnComplete = new Function("oForm", uploader.dialogOnComplete);
			}
			$modal.showDialogForm('Upload', uploader.formId, dialogOnOpen, null, dialogOnComplete, true, true);
		}
	}
}

Class.create("EmptyRecycle", Action, {
	execute : function(){
		app.getContextHolder().selectAll();				    
		window.setTimeout(function(){
			app.actionBar.fireAction('delete');
		}, 200);
	}
}

Class.create("Download", Action, {
	execute : function(){
		var userSelection = app.getUserSelection();
		if((userSelection.isUnique() && !userSelection.hasDir()) || (zipEnabled && multipleFilesDownloadEnabled))
		{
			if(gaTrackEvent){
				fileNames = userSelection.getFileNames();
				for(var i=0; i<fileNames.length;i++){
					gaTrackEvent("Data", "Download", fileNames[i]);
				}												
			}
			var agent = navigator.userAgent;
			if(agent && (agent.indexOf('iPhone')!=-1||agent.indexOf('iPod')!=-1||agent.indexOf('iPad')!=-1||agent.indexOf('iOs')!=-1)){
				var downloadUrl = serverAccessPath+'&get_action=download';
				downloadUrl = userSelection.updateFormOrUrl(null,downloadUrl);
				document.location.href=downloadUrl;
			}else{
				$('download_form').action = window.serverAccessPath;
				$('download_form').secure_token.value = Connection.SECURE_TOKEN;
				$('download_form').select("input").each(function(input){
					if(input.name!='get_action' && input.name!='secure_token') input.remove();
				});
				userSelection.updateFormOrUrl($('download_form'));
				$('download_form').submit();
			}
		}
		else
		{
			var loadFunc = function(oForm){							
				var dObject = oForm.getElementsBySelector('div[id="multiple_download_container"]')[0];
				var downloader = new MultiDownloader(dObject, serverAccessPath+'&action=download&file=');
				downloader.triggerEnd = function(){hideLightBox()};
				fileNames = userSelection.getFileNames();
				for(var i=0; i<fileNames.length;i++)
				{
					downloader.addListRow(fileNames[i]);
				}				
			};
			var closeFunc = function(){
				hideLightBox();
				return false;
			};
			$modal.showDialogForm('Download Multiple', 'multi_download_form', loadFunc, closeFunc, null, true);
		}
	},
	onSelectionChange : function(){
		if(app){
			var userSelection = app.getUserSelection();
			var action = app.actionBar.getAction("download");
			if(zipEnabled && multipleFilesDownloadEnabled){
				if(action){
					if((userSelection.isUnique() && !userSelection.hasDir()) || userSelection.isEmpty()){
						action.setIcon('download_manager.png');
					}else{
						action.setIcon('accessories-archiver.png');
					}
				}
			}else{
				if(userSelection.hasDir() && action){
					action.selectionContext.dir = false;
				}
			}
		}
	}
}

Class.create("Compress", Action, {
	execute : function(){
		var userSelection = app.getUserSelection();					
		if((zipEnabled && multipleFilesDownloadEnabled))
		{
			var loadFunc = function(oForm){
				var zipName;
				if(userSelection.isUnique()){
					zipName = getBaseName(userSelection.getUniqueFileName());
					if(!userSelection.hasDir()) zipName = zipName.substr(0, zipName.lastIndexOf("\."));
				}else{
					zipName = getBaseName(userSelection.getContextNode().getPath());
					if(zipName == "") zipName = "Archive";
				}
				var index=1;
				var buff = zipName;
				while(userSelection.fileNameExists(zipName + ".zip")){
					zipName = buff + "-" + index; index ++ ;
				}
				oForm.select('input[id="archive_name"]')[0].value = zipName + ".zip" ;
			};
			var closeFunc = function(){
				userSelection.updateFormOrUrl($modal.getForm());
				app.actionBar.submitForm($modal.getForm());			
				hideLightBox();
			};
			$modal.showDialogForm('Compress selection to ...', 'compress_form', loadFunc, closeFunc);
		}
	},
	onSelectionChange : function(){
		if(app){
			var userSelection = app.getUserSelection();
			var action = app.actionBar.getAction("compress");
			if(!zipEnabled || !multipleFilesDownloadEnabled){
				if(action){
					if(userSelection.isUnique()) action.selectionContext.multipleOnly = true;
					else action.selectionContext.unique = true;
				}
			}
		}
	}
}

Class.create("DownloadChunk", Action, {
	execute : function(){
		var userSelection = app.getUserSelection();

		var loadFunc = function(oForm){													
			var dObject = oForm.down('div[id="multiple_download_container"]');
			var legendDiv = oForm.down('div.dialogLegend');
			legendDiv.next("br").remove();
			legendDiv.update(I18N[399]+'<br>'+I18N[401]+'<a href="'+I18N[402]+'" target="_blank">'+I18N[402]+'</a>');
			dObject.insert({before:'\
				<div class="dialogButtons" id="chunk_dl_form" style="height:36px;"> \
					<span style="display:inline-block;float:left;margin-top: 11px;margin-left: 4px;margin-right: 4px;">'+I18N[400]+'</span> <input type="text" style="float:left;margin-top:5px; text-align:right; width:30px;height:24px;" name="chunk_count" id="chunk_count" value="4"> \
					<input type="image" style="float:left;" id="dl_form_submit" src="THEME_FOLDER/image/action/22/dialog_ok_apply.png" height="22" width="22" title="OK" class="dialogButton dialogFocus">\
				</div> \
			'});
			$("dl_form_submit").observe("click", function(e){
				Event.stop(e);
				var connection = new Connection();
				connection.addParameter("get_action", "prepare_chunk_dl"); 
				connection.addParameter("chunk_count", $("chunk_count").value );
				connection.addParameter("file", userSelection.getUniqueNode().getPath()); 
				var downloader = new MultiDownloader(dObject, '');
				connection.onComplete = function(transp){
					var chunkData = transp.responseJSON;
					downloader.setDownloadUrl(serverAccessPath+'&action=download_chunk&file_id='+chunkData.file_id);
					downloader.triggerEnd = function(){hideLightBox();};
					for(var i=0; i<chunkData.chunk_count;i++){
						downloader.addListRow("&chunk_index=" + i, chunkData.localname + " (part " + (i + 1) + ")");
					}
					downloader.removeOnLoad();
				};
				downloader.setOnLoad();
				connection.sendAsync();							
			});
		};
		var closeFunc = function(){
			hideLightBox();
			return false;
		};
		$modal.showDialogForm('Download Multiple', 'multi_download_form', loadFunc, closeFunc, null, true);						
	}
}

Class.create("OpenWith", Action, {
	execute : function(){
		var editorData = window.actionArguments[0];
		if(!editorData){
				var selectedMime = getMimeType(app.getUserSelection().getUniqueNode());
				var editors = app.findEditorsForMime(selectedMime);
				if(editors.length && editors[0].openable){
						editorData = editors[0];
				}
		}
		if(editorData){
				app.loadEditorResources(editorData.resourcesManager);
				$modal.openEditorDialog(editorData);
		}else{
				if(app.actionBar.getAction("download")){
						app.actionBar.getAction("download").apply();
				}
		}
	},
	subMenu : function(){
		var context = window.builderContext;
		context.builderMenuItems = $A([]);
		var selectedMime = getMimeType(app.getUserSelection().getUniqueNode());
		var editors = app.findEditorsForMime(selectedMime);
		if(editors.length){
				var index = 0;
				var sepAdded = false;
				editors.each(function(el){
						if(!el.openable) return;
						if(el.mimes.include('*')){
								if(!sepAdded && index > 0){
										context.builderMenuItems.push({separator:true});
								}
								sepAdded = true;
						}
						context.builderMenuItems.push({
								name:el.text,
								alt:el.title,
								isDefault : (index == 0),
								image:resolveImageSource(el.icon, '/image/action/ICON_SIZE', 22),
								callback:function(e){this.apply([el]);}.bind(context)
						} );
						index++;
				} );
		}
		if(!index){
				context.builderMenuItems.push({
						name:I18N[324],
						alt:I18N[324],
						image:resolveImageSource('button_cancel.png', '/image/action/ICON_SIZE', 22),
						callback:function(e){}
				} );
		}
	}
}

Class.create("Link", Action, {
	execute : function(){
		var loadFunc = function (oForm){
			var link;
			var input = oForm.down('input[type="text"]');
			var url = document.location.href;
			if(url.indexOf('#') > 0){
				url = url.substring(0, url.indexOf('#'));
			}
			if(url.indexOf('?') > 0){
				url = url.substring(0, url.indexOf('?'));
			}
			var repoId = app.repositoryId || (app.user ? app.user.activeRepository : null);
			if(app.user){
				var slug = app.user.repositories.get(repoId).getSlug();
				if(slug) repoId = slug;
			}
			link = url + '?repository_id=' + repoId + '&folder=' + encodeURIComponent(app.getUserSelection().getUniqueFileName());
			input.value = link;
									var email = oForm.down('a[id="email"]');
									if (email){ 
											email.setAttribute('href', 'mailto:unknown@unknown.com?Subject=UPLOAD&Body='+encodeURIComponent(link)); 
									}
			input.select();
		};
		$modal.showDialogForm('Get', 'link_form', loadFunc, function(){
				hideLightBox(true);
				return false;
		}, null, true);
	}
}

Class.create("Restore", Action, {
	execute : function(){
		var userSelection = app.getUserSelection();
		var fileNames = $A(userSelection.getFileNames());
		var connection = new Connection();
		connection.addParameter('get_action', 'restore');
		connection.addParameter('dir', userSelection.getCurrentRep());
		connection.onComplete = function(transport){
			app.actionBar.parseXmlMessage(transport.responseXML);
		};
		fileNames.each(function(filename){
			connection.addParameter('file', filename);
			connection.sendAsync();
		});
	}
}

Class.create("Mkdir", Action, {
	execute : function(){
		$modal.showDialogForm('Create', 'mkdir_form', null, function(){
				var oForm = $($modal.getForm());
				var elementToCheck=(oForm['dirname']);
				if(app.getContextHolder().fileNameExists($(elementToCheck).getValue()))
				{
						alert(I18N[125]);
						return false;
				}
				app.actionBar.submitForm(oForm);
				hideLightBox(true);
				return false;
		});
	}
}

Class.create("Mkfile", Action, {
	execute : function(){
		$modal.showDialogForm('Create', 'mkfile_form', null, function(){
				var oForm = $($modal.getForm());
				var elementToCheck=(oForm['filename']);
				if(app.getContextHolder().fileNameExists($(elementToCheck).getValue()))
				{
						alert(I18N[125]);
						return false;
				}
				app.actionBar.submitForm(oForm);
				hideLightBox(true);
				return false;
		});
	}
}

Class.create("Rename", Action, {
	execute : function(){
					var callback = function(node, newValue){
						var filename = node.getPath();
						var connection = new Connection();
						connection.addParameter('get_action', 'rename');
						connection.addParameter('file', filename);
						connection.addParameter('filename_new', newValue);
						connection.onComplete = function(transport){
							app.actionBar.parseXmlMessage(transport.responseXML);
						};
						connection.sendSync();
					};
					if(app.getUserSelection() && app.getUserSelection().getSelectionSource() && app.getUserSelection().getSelectionSource().switchCurrentLabelToEdition) {app.getUserSelection().getSelectionSource().switchCurrentLabelToEdition(callback);}
	}
}

Class.create("Copy", Action, {
	execute : function(){
					if(app.user){
						var user = app.user;
						var activeRepository = user.getActiveRepository();
						if(app.getUserSelection().hasDir() && !user.canWrite()){
							throw new Error(I18N[374]);
						}
					}
					var context = app.actionBar;
					var onLoad = function(oForm){
						var getAction = oForm.select('input[name="get_action"]')[0];
						getAction.value = 'copy';					
						this.treeSelector = new TreeSelector(oForm);
						if(!app.getUserSelection().hasDir() && user && user.canCrossRepositoryCopy() && user.hasCrossRepositories()){
							var firstKey ;
							var reposList = new Hash();
							user.getCrossRepositories().each(function(pair){
								if(!firstKey) firstKey = pair.key;
								reposList.set(pair.key, pair.value.getLabel());								
							}.bind(this));
							if(!user.canWrite()){
								var provider = new RemoteNodeProvider({tmp_repository_id:firstKey});
								var rootNode = new Item("/", false, I18N[373], "folder.png", provider);								
								this.treeSelector.load(rootNode);
							}else{
								this.treeSelector.load();								
							}
							this.treeSelector.setFilterShow(true);							
							reposList.each(function(pair){
								this.treeSelector.appendFilterValue(pair.key, pair.value);
							}.bind(this)); 
							if(user.canWrite()) this.treeSelector.appendFilterValue(activeRepository, "&lt;"+I18N[372]+"&gt;", 'top');
							this.treeSelector.setFilterSelectedIndex(0);
							this.treeSelector.setFilterChangeCallback(function(e){
								externalRepo = this.filterSelector.getValue();
								var provider = new RemoteNodeProvider({tmp_repository_id:externalRepo});
								this.resetRootItem(new Item("/", false, I18N[373], "folder.png", provider));
							});
						}else{
							this.treeSelector.load();
						}
					}.bind(context);
					var onCancel = function(){
						this.treeSelector.unload();
						hideLightBox();
					}.bind(context);
					var onSubmit = function(){
						var oForm = $modal.getForm();
						var getAction = oForm.select('input[name="get_action"]')[0];
						var selectedNode = this.treeSelector.getSelectedNode();
						if(activeRepository && this.treeSelector.getFilterActive(activeRepository)){
							getAction.value = "cross_copy" ;
						}
						app.getUserSelection().updateFormOrUrl(oForm);
						this.submitForm(oForm);
						this.treeSelector.unload();
						hideLightBox();
					}.bind(context);
					$modal.showDialogForm('Move/Copy', 'copymove_form', onLoad, onSubmit, onCancel);				
	},
	onContextChange : function(){
		if(app){
			var action = app.actionBar.getAction("copy");
			if(action){
				action.rightsContext.write = true;
				var user = app.user;
				if(user && !user.canWrite() && user.canCrossRepositoryCopy() && user.hasCrossRepositories()){
					action.rightsContext.write = false;
					action.selectionContext.dir = false;
					app.actionBar.defaultActions.unset('ctrldragndrop');
					app.actionBar.defaultActions.unset('dragndrop');
				}
				if(app.getContextNode().hasMimeInBranch("browsable_archive")){
					action.setLabel(247, 248);
					action.setIcon('ark_extract.png');
				}else{
					action.setLabel(66, 159);
					action.setIcon('editcopy.png');
				}
			}
		}
	}
}

Class.create("Move", Action, {
	execute : function(){
		var context = app.actionBar;
		if(app.user){
			var user = app.user;
			var activeRepository = user.getActiveRepository();
		}
		var context = app.actionBar;
		var onLoad = function(oForm){
			var getAction = oForm.select('input[name="get_action"]')[0];
			getAction.value = 'move';
			this.treeSelector = new TreeSelector(oForm);
			this.treeSelector.load();
			if(!app.getUserSelection().hasDir() && user && user.canCrossRepositoryCopy() && user.hasCrossRepositories()){
				this.treeSelector.setFilterShow(true);
				user.getCrossRepositories().each(function(pair){
					this.treeSelector.appendFilterValue(pair.key, pair.value.getLabel());
				}.bind(this));
				this.treeSelector.appendFilterValue(activeRepository, "&lt;"+I18N[372]+"&gt;", 'top');
				this.treeSelector.setFilterSelectedIndex(0);
				this.treeSelector.setFilterChangeCallback(function(e){
					externalRepo = this.filterSelector.getValue();
					var provider = new RemoteNodeProvider({tmp_repository_id:externalRepo});
					this.resetRootItem(new Item("/", false, I18N[373], "folder.png", provider));
				});
			}						
		}.bind(context);
		var onCancel = function(){
			this.treeSelector.unload();
			hideLightBox();
		}.bind(context);
		var onSubmit = function(){
			var oForm = $modal.getForm();
			var getAction = oForm.down('input[name="get_action"]');
			var selectedNode = this.treeSelector.getSelectedNode();
			if(selectedNode == app.getContextNode().getPath()){
				alert(I18N[183]);
				return false;
			}
			app.getUserSelection().updateFormOrUrl(oForm);						
			if(activeRepository && this.treeSelector.getFilterActive(activeRepository)){
				getAction.value = "cross_copy" ;
				var subAction = new Element('input', {type:'hidden',name:'moving_files',value:'true'});
				oForm.insert(subAction);
				this.submitForm(oForm, false, function(transport){
					var message = XPathSelectSingleNode(transport.responseXML, "//message");
					if(message.getAttribute("type") == "ERROR"){
						app.displayMessage("ERROR", message.firstChild.nodeValue);
						return;
					}
					getAction.value = "delete";
					subAction.name = "force_deletion"; 								
					this.submitForm(oForm, false, function(transport2){
						var deleteMessage = XPathSelectSingleNode(transport2.responseXML, "//message");
						if(deleteMessage.getAttribute("type") == "ERROR"){
							app.displayMessage("ERROR", message.firstChild.nodeValue + '\n\n' + deleteMessage.firstChild.nodeValue);
							return;								
						}else{
							app.displayMessage("SUCCESS", message.firstChild.nodeValue);
							app.fireContextRefresh();
						}
					}.bind(this));
				}.bind(this));
			}else{
				this.submitForm(oForm);
			}
			this.treeSelector.unload();
			hideLightBox();
		}.bind(context);
		$modal.showDialogForm('Move/Copy', 'copymove_form', onLoad, onSubmit, onCancel);				
	}
}

Class.create("Delete", Action, {
	execute : function(){
		var onLoad = function(oForm){
				var message = I18N[177];
				var repoHasRecycle = app.getContextHolder().getRootNode().getMetadata().get("repo_has_recycle");
				if(repoHasRecycle && repoHasRecycle == "true" && app.getContextNode().getMime() != "recycle"){
					message = I18N[176];
				}
					$(oForm).getElementsBySelector('span[id="delete_message"]')[0].innerHTML = message;
		};
		$modal.showDialogForm('Delete', 'delete_form', onLoad, function(){
			var oForm = $modal.getForm();
			app.getUserSelection().updateFormOrUrl(oForm);
			app.actionBar.submitForm(oForm);
			hideLightBox(true);
			return false;
		});
	}

Class.create("Chmod", Action, {
	execute : function(){
		var userSelection =  app.getUserSelection();
		var loadFunc = function(oForm){
				app.actionBar.propertyPane = new PropertyPanel(userSelection, oForm);
		};
		var completeFunc = function(){
				if(!app.actionBar.propertyPane.valueChanged()){
						hideLightBox();
						return false;
				}
				userSelection.updateFormOrUrl($modal.getForm());
				app.actionBar.submitForm($modal.getForm());
				hideLightBox();
				return false;
		};
		$modal.showDialogForm('Edit Online', 'properties_box', loadFunc, completeFunc);
	}
}
