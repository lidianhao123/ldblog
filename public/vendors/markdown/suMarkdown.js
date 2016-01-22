


(function($){
    $.fn.upload=function(url,settings){

        var option={
            method:'POST',
            action:url,
            dataType:'json',
            limits:{},
            preview:null
        };
        if(!settings) var settings={};
        $.extend(option,settings);
        var getXhr = function(){
            var xhr;
            return function(){
                if (xhr) return xhr;
                if (typeof XMLHttpRequest !== 'undefined') {
                    xhr = new XMLHttpRequest();
                } else {
                    var v = [
                        "Microsoft.XmlHttp",
                        "MSXML2.XmlHttp.5.0",
                        "MSXML2.XmlHttp.4.0",
                        "MSXML2.XmlHttp.3.0",
                        "MSXML2.XmlHttp.2.0"
                    ];
                    for (var i=0; i < v.length; i++){
                        try {
                            xhr = new ActiveXObject(v[i]);
                            break;
                        } catch (e){}
                    }
                }
                return xhr;
            }
        }();
        function checkExtension(dst,src){
            var tmp=dst.split('/');
            if(tmp[0]=='image'){
                if($.inArray('image/*',src)==-1){
                    if($.inArray(tmp[1],src)==-1) return false;
                    else return true;
                }
                else return true;
            }
            else{
                if($.inArray(tmp[1],src)==-1) return false;
                else return true;
            }
        }




        var fileList=[];
        $(this).each(function(){
            for(var i=0;i<this.files.length;i++){
                fileList.push(this.files[i]);
            }
        });
        return $.Deferred(function(){
            var xhr=getXhr();
            var defer=this;
            this.abort=function(){
                if(xhr) xhr.abort();
                return defer;
            };
            this.preview=function(tmp){
                for(var i in fileList){
                    var file=fileList[i];
                    if(file.type.split('/')[0]=='image'){
                        if(!window.FileReader){
                            alert('Too old browser, you need a modern one!');
                            return defer;
                        }
                        var reader=new FileReader();
                        reader.name=file.name;
                        reader.onloadend=function(evt){
                            console.log(this.num);
                            if(reader.error) tmp.append($('<p>'+this.name+' fails to be loaded</p>'));

                            else tmp.append($('<img>',{'src':evt.target.result,'alt':this.name}));
                        };
                        reader.readAsDataURL(file);
                    }
                    else continue;
                }
                return defer;
            };
            if(window.FormData) var form=new FormData();
            else{
                // alert('Too old for your browser, get a modern one!');
                this.reject(xhr,null,new Error('Too Old Browser'));
                return this;
            }
            if(!xhr){
                this.reject(xhr,null,new Error('Too Old Browser'));
                return this;
            }
            if(!option.action){
                this.reject(xhr,null,new Error('URL Needed'));
                return this;
            }
            xhr.open(option.method,option.action);
            xhr.upload.addEventListener('progress',function(evt){
                if(evt.lengthComputable){
                    var complete=evt.loaded/evt.total | 0;
                }
                defer.notify(complete);
            });

            xhr.onreadystatechange=function(){
                if(this.readyState!==4) return;
                if(this.status==200){
                    var data;
                    switch(option.dataType){
                        case 'text':
                            data=this.responseText;
                            break;
                        case 'html':
                            data= $.parseHTML(this.responseText);
                            break;
                        case 'xml':
                            data= $.parseXML(this.responseXML);
                            break;
                        case 'json':
                            data= $.parseJSON(this.responseText);
                            break;
                        default :break;
                    }
                    defer.resolve(data,this.status,this);
                }
                else{
                    defer.reject(this,this.status,this.responseText);
                }
            };
            if(fileList.length==0){
                //defer.reject(xhr,xhr.status,new Error('No File Select'));
                return defer;
            }
            if(option.limits.fieldSize&&option.limits.fieldSize<fileList.length){
                var err=new Error('Too Many Files');
                defer.reject(xhr,xhr.status,err);
                return defer;
            }
            for(var i in fileList){
                var file=fileList[i];
                if(option.limits.validExtension&&!checkExtension(file.type,option.limits.validExtension)){
                    var err=new Error('File Type Error');
                    err.filename=file.name;
                    defer.reject(xhr,xhr.status,err);
                    continue;
                }
                if(option.limits.fileSize&&option.limits.fileSize<file.size){
                    var err=new Error('Too Large Size');
                    defer.reject(xhr,xhr.status,err);
                    return defer;
                }

                if(option.start) option.start(file);
                form.append(i,file,file.name);
                if(option.maxSize) option.maxSize-=file.size;
            }
            if(option.preview) this.preview(option.preview);
            xhr.send(form);
            return defer;
        });
    };
})(jQuery);

var SuMarkdown=function(option){
   var load=function(mark){
       var get=function(dst){
           var result={};
           $(dst).each(function(i,e){
               result.select=(
                   // Mozilla, Webkit
                   ('selectionStart' in e && function()
                   {
                       var l = e.selectionEnd - e.selectionStart;
                       return {
                           start: e.selectionStart,
                           end: e.selectionEnd,
                           length: l,
                           text: e.value.substr(e.selectionStart, l)
                       };
                   }) ||
                   // Internet Explorer
                   (document.selection && function()
                   {
                       e.focus();
                       var r = document.selection.createRange();
                       if (r === null)
                       {
                           return {
                               start: 0,
                               end: e.value.length,
                               length: 0
                           };
                       }
                       var re = e.createTextRange();
                       var rc = re.duplicate();
                       re.moveToBookmark(r.getBookmark());
                       rc.setEndPoint('EndToStart', re);
                       return {
                           start: rc.text.length,
                           end: rc.text.length + r.text.length,
                           length: r.text.length,
                           text: r.text
                       };
                   }) ||
                   // Not supported
                   function()
                   {
                       return null;
                   }
                   )();
               if(result.select) {
                   result.container=$(this);
                   return false;
               }
               else return true;
           });
           return result;
       };
       var replace= function (target,text,option){
           var tmp;
           $(target).each(function(i,e){
               tmp=(
                   // Mozilla, Webkit
                   ('selectionStart' in e && function()
                   {
                       var start = e.selectionStart;
                       e.value = e.value.substr(0, e.selectionStart) + text + e.value.substr(e.selectionEnd, e.value.length);
                       if (option === true || option === undefined)
                       {
                           e.selectionStart = start;
                           e.selectionEnd = start + text.length;
                       }
                       else
                       {
                           e.selectionStart = e.selectionEnd = start + text.length;
                       }
                       return $(e);
                   }) ||
                   // Internet Explorer
                   (document.selection && function()
                   {
                       e.focus();
                       document.selection.createRange().text = text;
                       return $(e);
                   }) ||
                   // Not supported
                   function()
                   {
                       e.value += text;
                       return $(e);
                   }
                   )();
               if(tmp) return false;
               else return true;
           });
           return tmp;
       };
       var methods={
           bold:function(){
               var reg=/^\*{2}[^\0]*\*{2}$/m;
               var target=get($('textarea',mark));
               var dst;
               if(!reg.test(target.select.text))
                   dst=replace(target.container,'**'+target.select.text+'**');

               else dst=replace(target.container,target.select.text.split('**')[1]);

               return dst;
           },
           italic:function(){
               var reg=/^_[^\0]*_$/m;
               var target=get($('textarea',mark));
               var dst;
               if(!reg.test(target.select.text))
                   dst=replace(target.container,'_'+target.select.text+'_');
               else dst=replace(target.container,target.select.text.split('_')[1]);
               return dst;
           },
           head:function(){
               var reg=/^#{1,6}[^\0]*/m;
               var target=get($('textarea',mark));
               var dst;
               if(!reg.test(target.select.text))
                   dst=replace(target.container,'###'+target.select.text);
               else dst=replace(target.container,target.select.text.split(/#{1,6}/)[1]);
               return dst;
           },
           link:function(){
               var reg=/^\[[^\0]*\]\([^\0]*\)$/m;
               var target=get($('textarea',mark));
               var dst;

               if(!reg.test(target.select.text)) {
                   var url=prompt('Enter your URL :');
                   if(!url) return target.container;
                   if(target.select.text=='') target.select.text="Enter your link description here:";
                   dst = replace(target.container, '[ ' + target.select.text + ' ](' + url + ')');
               }
               else dst=replace(target.container,target.select.text.split('[')[1].split(']')[0]);
               return dst;
           },
           img:function(){
               var reg=/^!\[[^\0]*\]\([^\0]*\)$/m;
               var target=get($('textarea',mark));
               var dst;

               if(!reg.test(target.select.text)) {
                   if(option.upload)
                        var url=prompt('Enter URL Or Drag Local Image Into Editor Directly:');
                   else var url=prompt('Enter Your Image URL');
                   if(!url) return target.container;
                   if(target.select.text=='') target.select.text="Enter your image description here:";
                   dst = replace(target.container, '![ ' + target.select.text + ' ](' + url + ')');
               }
               else dst=replace(target.container,target.select.text.split('[')[1].split(']')[0]);
               return dst;
           },
           list:function(){
               var target=get($('textarea',mark));
               if(target.select.text=='') target.select.text='list text here';
               var dst=replace(target.container,'- '+target.select.text);
               return dst;
           },
           orderlist:function(){
               var target=get($('textarea',mark));
               if(target.select.text=='') target.select.text='list text here';
               var dst=replace(target.container,'1. '+target.select.text);
               return dst;
           },
           code:function(){
               var reg=/^`[^\0]*`$/m;
               var target=get($('textarea',mark));
               var dst;
               if(target.select.text=='') target.select.text='list text here';
               if(!reg.test(target.select.text))
                   dst=replace(target.container,'`'+target.select.text+'`');
               else dst=replace(target.container,target.select.text.split('`')[1]);
               return dst;
           },
           quote:function(){
               var target=get($('textarea',mark));
               if(target.select.text=='') target.select.text='quote here';
               var dst=replace(target.container,'> '+target.select.text);
               return dst;
           },
           tab:function(){
               var target=get($('textarea',mark));
               var dst=replace(target.container,'    ' +target.select.text.split('\n').join('\n    '),false);
               return dst;
           },
           preview:function(event){

               var blank=$('.suPreview',mark);
               var state=blank.css('display');
               var target=get($('textarea',mark));
               if(state=='none'){

                   blank.html(marked(target.container.val()));
                   $('pre code',blank).each(function(i,block){
                       hljs.highlightBlock(block);
                   });
                   $('.suEditor',mark).css('display','none');
                   blank.css('display','block');
               }
               else{
                   blank.css('display','none');
                   $('.suEditor',mark).css('display','block');
                   target.container.focus();
               }

           },
           fullscreen:function(){
               $(mark).each(function(){
                   var
                       el = this
                       , rfs =
                           el.requestFullScreen
                           || el.webkitRequestFullScreen
                           || el.mozRequestFullScreen
                       ;
                   if(!rfs) {
                       alert('Your browser does not support fullscreen mode');
                       return false;
                   }
                   rfs.call(el);

               });
               return $('textarea',mark);
           },
           plus:function(){
               $('.su-toolbar .su-tool-upload',mark).click();
               return $('textarea',mark);
           }

       };

       //set the hotkey
       $('textarea',mark).attr('data-state','0').on('keyup',function(event){
           if(event.keyCode==17) $(this).attr('data-state','0');
       });
       $('textarea:input',mark).on('keydown',function(event){
           var dst,tmp;
           switch(event.keyCode){
               case 9:
                   event.preventDefault();
                   dst=methods.tab();
                   break;
               case 17:
                   $(this).attr('data-state','1');
                   break;
               case 66:
                   tmp=$(this).attr('data-state');
                   if(tmp=='1') {
                       methods.bold();
                       event.preventDefault();
                   }
                   break;
               case 73:
                   tmp=$(this).attr('data-state');
                   if(tmp=='1') {
                       methods.italic();
                       event.preventDefault();
                   }
                   break;
               case 71:
                   tmp=$(this).attr('data-state');
                   if(tmp=='1') {
                       methods.img();
                       event.preventDefault();
                   }
                   break;
               case 72:
                   tmp=$(this).attr('data-state');
                   if(tmp=='1') {
                       methods.head();
                       event.preventDefault();
                   }
                   break;
               case 75:
                   tmp=$(this).attr('data-state');
                   if(tmp=='1') {
                       methods.code();
                       event.preventDefault();
                   }
                   break;
               case 76:
                   tmp=$(this).attr('data-state');
                   if(tmp=='1') {
                       methods.link();
                       event.preventDefault();
                   }
                   break;
               case 79:
                   tmp=$(this).attr('data-state');
                   if(tmp=='1') {
                       methods.orderlist();
                       event.preventDefault();
                   }
                   break;
               case 81:
                   tmp=$(this).attr('data-state');
                   if(tmp=='1') {
                       methods.block();
                       event.preventDefault();
                   }
                   break;
               case 85:
                   tmp=$(this).attr('data-state');
                   if(tmp=='1') {
                       methods.list();
                      event.preventDefault();
                   }
                   break;

               default :   break;
           }
       });

       $('.su-toolbar > *',mark).each(function(i,element){
           var str=$(this).attr('class');
           str=str.split(/\s+/g);
           for(var i in str){
               if(str[i].substring(0,8)=='su-tool-'){
                   var method=str[i].substring(8);
                   if(method=='preview'||method=='upload') continue;
                   $(this).on('click',function(event){
                       event.preventDefault();
                       var dst=methods[method]();
                       if(option.preview)
                           $('.suPreview',mark).html(marked(dst.val()));
                       dst.focus();
                   });
               }
           }
           return true;
       });

       //hide the progressbar
       $('.suProgress',mark).css('display','none');

       //simply initialize the CSS
       if(!option.clean){
           $('.suPreview',mark).css({
               "width":"50%",
               "float":"left",
               'overflow': 'auto',
               'padding': '0 20px'
           });
           $('.suEditor',mark).css({
               "width":"50%",
               "float":"left",
               "display":"block"
           });
           $('textarea',mark).css({
               "tab-size":"4",
               "padding":"20px",
               "resize":"none",
               "overflow":"auto"
           });
       }
       if(option.preview){
           $('.su-tool-preview',mark).css('display','none');
           $('.suEditor textarea',mark).on('keyup',function(){
               $('.suPreview',mark).html(marked($(this).val()));
               $('pre code',mark).each(function(i,block){
                   hljs.highlightBlock(block);
               });
           });
       }
       else{
           $('.suPreview',mark).css({
               'width':"100%",
               'display':'none',
               "border-left":"solid 1px",
               "border-color": $('textarea',mark).css('border-color')
           });
           $('.suEditor',mark).css({width:"100%"});
           $('.su-tool-preview',mark).on('click',function(){
               methods.preview();
           });
       }

       if(option.upload){
           $('.su-tool-plus',mark).css('display','block');

           $('.su-tool-upload',mark).on('change',function(){
               console.log('wol');
               var fileList=this.files;
               $(this).upload(option.upload,{
                   start:function(file){
                       $('.suProgress',mark).css('display','block');
                   }
               }).done(function(data){
                       if(data.success){
                           $('.suProgress .su-progress-bar',mark)
                               .css('width','100%')
                               .text('100%');
                           var target=get($('textarea',mark));
                           var dst;
                           for(var i=0;i<data.path.length;i++){
                               target.select.text+=('\n ['+fileList[i].name+']('+data.path[i]+')\n');
                           }
                           replace(target.container,target.select.text);
                       }
                   }).always(function(){
                       $('.suProgress',mark).css('display','none');
                   console.log('wdw');
                       if(option.preview){
                            $('.suPreview',mark).html(marked($('textarea',mark).val()));
                            $('.suPreview pre code',mark).each(function(i,block){
                                hljs.highlightBlock(block);
                            });
                       }
                   }).progress(function(percent){
                        $('.su-progress-bar',mark)
                            .css('width',percent.toString()+'%')
                            .text(percent+'%');
                   });
           });
           //handle the drop image upload
           $('textarea',mark).each(function(){
               if(!('draggable') in document.createElement('span')) return false;
               this.ondrop=function(evt){
                   evt.preventDefault();
                   console.log(evt);
                   this.files=evt.dataTransfer.files;
                   var myFile=this.files[0];
                   var area=this;
                   $(this).upload(option.upload,{
                       limits:{
                           validExtension:['image/*']
                       }
                   }).done(function(data){
                       if(data.success){
                           var target=get($(area));
                           var dst;

                          if(target.select.text=='')
                              target.select.text = myFile.name;
                           dst = replace(target.container, '![ ' + target.select.text + ' ](' +data.path[0]+ ')');
                           if(option.preview){
                               $('.suPreview',mark).html(marked($(area).val()));
                               $('.suPreview pre code',mark).each(function(i,block){
                                   hljs.highlightBlock(block);
                               });
                           }
                           return dst;
                       }
                   }).progress(function(percentage){

                   });
               };
               return true;
           });
       }
       else{
            $('.su-tool-plus').css('display','none');
       }


       if(option.css) mark.css(option.css);
       if(option.textCss) $('.textarea',mark).css(option.textCss);
       if(option.previewCss) $('.suPreview',mark).css(option.previewCss);
       if(option.textHeight){
           $('textarea',mark).css('height',option.textHeight);
           $('.suPreview',mark).css('height',option.textHeight);
       }




   };

    if(!option.target) option.target=$('.suMarkdown');

    if(!option.insert){

        var mark=option.target;
        console.log($('textarea',mark).css('height'));
        load(option.target);
    }
    else{
        $.get(option.baseUrl,function(data){
            mark=$("<div></div>");
            mark.html(data);
            load(mark);
            $(option.target).append(mark);
        },'html');
    }

};
