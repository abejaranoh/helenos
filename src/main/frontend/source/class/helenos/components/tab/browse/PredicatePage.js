/* ************************************************************************
Copyright:
  2012 Tomek Kuprowski
License:
  GPLv2: http://www.gnu.org/licences/gpl.html
Authors:
  Tomek Kuprowski (tomekkuprowski at gmail dot com)
 ************************************************************************ */
qx.Class.define("helenos.components.tab.browse.PredicatePage",
{
    extend : helenos.components.tab.browse.AbstractPage,
 
    construct : function(ksName, cfName)
    {
        this.base(arguments, ksName, cfName);
        this.__disableNextPrevBtns();
    },

    members :
    {
        __keyModeRBG : null,
        __columnsByRBG : null,
        
        __keyFromTF : null,
        __keyToTF : null,
        __keyMode : 'predicate',
        __keyTF : null,
        __keysLimitTF : null,
        
        __nameStartTF : null,
        __nameEndTF : null,
        __sNameTF : null,
        __columnNamesTF : null,
        
        __keysPredicateCP : null,
        __keysRangeCP : null,
        __rangeColNamesCP : null,
        __rangeFromToCP : null,
        __reversedCB : null,
        __colsLimitTF : null,
        __firstKeyID : null,
        __lastKeyID : null,
        __prevPageBtn : null,
        __nextPageBtn : null,
        __nextPrevBtnsEnabled : false,
        
        _tree : null,
        
        _getSplitPaneOrientation : function() {
            return 'horizontal';
        },
        
        _getIconPath : function() {
            return 'icon/16/apps/office-spreadsheet.png';
        },
        
        _performSearch  : function(e) {
            var keyFrom = this.__keyFromTF.getValue();
            var keyTo = this.__keyToTF.getValue();
            
            var sName = (this.__sNameTF == null ? null : this.__sNameTF.getValue());
            var consistencyLevel = this._consistencyLevelSB.getSelection()[0].getLabel();
            
            var nameStart, nameEnd, reversed, columnNames;
            if (this.__columnsByRBG.getSelection()[0].getLabel() == 'range') {
                nameStart = this.__nameStartTF.getValue();
                nameEnd = this.__nameEndTF.getValue();
                reversed = this.__reversedCB.getValue();
            } else {
                columnNames = this.__columnNamesTF.getValue().split(',');
            }

            var result = null;
            if (this.__keyMode == 'predicate') {
                result = helenos.util.RpcActionsProvider.queryPredicate(this._cfDef, consistencyLevel, keyFrom, columnNames, nameStart, nameEnd, sName, reversed);
            } else  {
                result = helenos.util.RpcActionsProvider.queryKeyRange(this._cfDef, consistencyLevel, keyFrom, keyTo, columnNames, nameStart, nameEnd, sName, reversed);
            }
            
            this.__firstKeyID = result[0].key;
            this.__lastKeyID = result[result.length-1].key;
            return result;
        },
        
        _getResultsPane : function() {
            var pane = this.base(arguments);
            pane.add(this.__getButtonsBar());
            return pane;
        },
        
        __getButtonsBar : function() {
            var buttonsBar = new qx.ui.toolbar.ToolBar();
            this.__prevPageBtn = new qx.ui.toolbar.Button('Previous', 'helenos/previous_page.png');
            this.__prevPageBtn.addListener('execute', this.__onPrevRange);
            
            this.__nextPageBtn = new qx.ui.toolbar.Button('Next', 'helenos/next_page.png');
            this.__nextPageBtn.addListener('execute', this.__onNextRange);
            
            buttonsBar.add(this.__prevPageBtn);
            buttonsBar.add(this.__nextPageBtn);
            return buttonsBar;
        },
        
        __onPrevRange : function(e) {
            // gdy lista wynikow jeszcze pusta to nie uzywaj przewijania wogole zrob szare
            this.__keyFromTF.setValue(this.__firstKeyID);
            this._performValidation();
        },
        
        __onNextRange : function(e) {
            // gdy lista wynikow jeszcze pusta to nie uzywaj przewijania wogole zrob szare
            this.__keyFromTF.setValue(this.__lastKeyID);
            this._performValidation();
        },
        
        _getCriteriaPane : function() {
            var widgets = new Array();
            widgets.push(this.__getKeysGB());
            widgets.push(this.__getColumnsGB());
            widgets.push(this.__getConsistencyLevelGB());
            
            var container = new qx.ui.container.Composite(new qx.ui.layout.VBox(5).set({alignX : 'left'}));
            container.setAppearance('criteria-pane');
            
            for (var i = 0; i < widgets.length; i++) {
                container.add(widgets[i]);
            }
            container.add(this._getSearchButton());
            
            var pane = new qx.ui.container.Scroll();
            pane.setWidth(180);
            pane.add(container);
            return pane;
        },
        
        __disableNextPrevBtns : function() {
            if (this.__nextPrevBtnsEnabled == true) {
                this.__prevPageBtn.setEnabled(false);
                this.__nextPageBtn.setEnabled(false);
                this._nextPrevBtnsEnabled = false;
            }
        },
        
        __enableNextPrevBtns : function() {
            if (this.__nextPrevBtnsEnabled == false) {
                this.__prevPageBtn.setEnabled(true);
                this.__prevPageBtn.setEnabled(true);
                this._nextPrevBtnsEnabled = true;
            }
        },

        __getConsistencyLevelGB : function() {
            this._initConsistencyLevelSB();
            
            var consLevelGB = new helenos.ui.GroupBoxV(this.tr('consistency.level'));
            consLevelGB.add(this._consistencyLevelSB);
            return consLevelGB;
        },

        __getColumnsGB : function() {
            var columnsGB = new helenos.ui.GroupBoxV('Columns');
            
            if (this._cfDef.columnType == 'Super') {
                this.__nameStartTF = new helenos.ui.TextField(this._cfDef.subComparatorType.className);
                this.__nameEndTF = new helenos.ui.TextField(this._cfDef.subComparatorType.className);
            } else {
                this.__nameStartTF = new helenos.ui.TextField(this._cfDef.comparatorType.className);
                this.__nameEndTF = new helenos.ui.TextField(this._cfDef.comparatorType.className);
            }
            
            columnsGB.add(this.__getRangeFromToBox());
            columnsGB.add(this.__getRangeColNamesBox());
            
            if (this._cfDef.columnType == 'Super') {
                this.__sNameTF = new helenos.ui.TextField(this._cfDef.comparatorType.className);
                columnsGB.add(new qx.ui.basic.Label('Super column name:'));
                columnsGB.add(this.__sNameTF);
            }
            
            columnsGB.add(new qx.ui.basic.Label('Columns mode:'));
            columnsGB.add(this.__getRangeModeBG());
            
            return columnsGB;
        },
        
        __getKeysGB : function() {          
            var keysGB = new helenos.ui.GroupBoxV('Keys');
            keysGB.add(this.__getKeysPredicateBox());
            keysGB.add(this.__getKeysRangeBox());
            
            keysGB.add(new qx.ui.basic.Label('Key mode:'));
            keysGB.add(this.__getKeyModeBG());
            
            return keysGB;
        },
        
         __getKeysPredicateBox : function(){
           this.__keysPredicateCP = new qx.ui.container.Composite(new qx.ui.layout.VBox(5)).set({padding : 0});
           this.__keyTF = new helenos.ui.TextField(this._cfDef.keyValidationClass);
           this.__keysPredicateCP.add(new qx.ui.basic.Label('Key:'));
           this.__keysPredicateCP.add(this.__keyTF);
           
           return this.__keysPredicateCP;
         },
         
         __getKeysRangeBox : function() {
           this.__keyFromTF = new helenos.ui.TextField(this._cfDef.keyValidationClass);
           this.__keyToTF = new helenos.ui.TextField(this._cfDef.keyValidationClass);
           this.__keysLimitTF = new qx.ui.form.TextField().set({filter : /[0-9]/, value : '10'});
           
           this.__keysRangeCP = new qx.ui.container.Composite(new qx.ui.layout.VBox(5)).set({padding : 0, visibility : 'excluded'});
           this.__keysRangeCP.add(new qx.ui.basic.Label('From:'));
           this.__keysRangeCP.add(this.__keyFromTF);
           this.__keysRangeCP.add(new qx.ui.basic.Label('To:'));
           this.__keysRangeCP.add(this.__keyToTF);
           this.__keysRangeCP.add(new qx.ui.basic.Label('Max keys:'));
           this.__keysRangeCP.add(this.__keysLimitTF);
           return this.__keysRangeCP;
         },
        
        __getRangeModeBG : function() {
            var byNameBT = new qx.ui.form.RadioButton('name');
            var byRangeBT = new qx.ui.form.RadioButton('range');
            
            this.__columnsByRBG = new qx.ui.form.RadioButtonGroup(new qx.ui.layout.HBox(8));
            this.__columnsByRBG.add(byNameBT);
            this.__columnsByRBG.add(byRangeBT);
            this.__columnsByRBG.setSelection([byRangeBT]);
            this.__columnsByRBG.addListener("changeSelection", this._onRangeModeToggled, this);
            return this.__columnsByRBG;
        },
        
        __getKeyModeBG : function() {
            var predicateBT = new qx.ui.form.RadioButton('predicate');
            var keyRangeBT = new qx.ui.form.RadioButton('key range');
            
            this.__keyModeRBG = new qx.ui.form.RadioButtonGroup(new qx.ui.layout.HBox(5));
            this.__keyModeRBG.add(predicateBT);
            this.__keyModeRBG.add(keyRangeBT);
            this.__keyModeRBG.setSelection([predicateBT]);
            this.__keyModeRBG.addListener("changeSelection", this._onKeyModeToggled, this);
            return this.__keyModeRBG;
        },
        
        __getRangeFromToBox : function() {
            this.__rangeFromToCP = new qx.ui.container.Composite(new qx.ui.layout.VBox(5)).set({padding : 0});
            
            this.__colsLimitTF = new qx.ui.form.TextField().set({filter : /[0-9]/, value : '10'});
            
            this.__rangeFromToCP.add(new qx.ui.basic.Label('From:'));
            this.__rangeFromToCP.add(this.__nameStartTF);
            this.__rangeFromToCP.add(new qx.ui.basic.Label('To:'));
            this.__rangeFromToCP.add(this.__nameEndTF);
            this.__rangeFromToCP.add(new qx.ui.basic.Label('Limit:'));
            this.__rangeFromToCP.add(this.__colsLimitTF);
            
            this.__reversedCB = new qx.ui.form.CheckBox('Reversed');
            this.__rangeFromToCP.add(this.__reversedCB);
            
            return this.__rangeFromToCP;
        },
        
        __getRangeColNamesBox : function() {
            this.__rangeColNamesCP = new qx.ui.container.Composite(new qx.ui.layout.VBox(5)).set({padding : 0, visibility : 'excluded'});

            this.__columnNamesTF = new qx.ui.form.TextArea().set({placeholder : 'comma separated columns list'});
            this.__rangeColNamesCP.add(new qx.ui.basic.Label('Column names:'));
            this.__rangeColNamesCP.add(this.__columnNamesTF);
            
            return this.__rangeColNamesCP;
        },
        
        _onRangeModeToggled : function(e) {
            var selectedBtnLabel = e.getData()[0].getLabel();
            if (selectedBtnLabel == 'name') {
                this.__rangeFromToCP.setVisibility('excluded');
                this.__rangeColNamesCP.setVisibility('visible');
            } else {
                this.__rangeFromToCP.setVisibility('visible');
                this.__rangeColNamesCP.setVisibility('excluded');
            }
        },
        
        _onKeyModeToggled : function(e) {
            var selectedBtnLabel = e.getData()[0].getLabel();
            if (selectedBtnLabel == 'predicate') {
                this.__keysRangeCP.setVisibility('excluded');
                this.__keysPredicateCP.setVisibility('visible');
            } else {
                this.__keysRangeCP.setVisibility('visible');
                this.__keysPredicateCP.setVisibility('excluded');
            }
            this.__keyMode = selectedBtnLabel;
        }
    }
});