//vue_app_server 服务器
//   app.js 
//   public/img/banner1.png ...
const express = require("express");
//第三方模块，移动文件
const fs = require("fs");
const multer = require("multer");
var app = express();
app.use(express.static("public"));
app.listen(5050);
const pool = require("./pool");
//创建目录，将图片保存在此目录
var upload = multer({dest:"public/img/user"})
//跨域访问配置

//1:加载模块cors
const cors = require("cors");
//2:配置cors
app.use(cors({
  origin:["http://127.0.0.1:3001"],//允许列表
  credentials:true   //是否验证
}));
//express mysql 参数 request;response
//跨域访问配置
//1:加载模块cors
const session = require("express-session");
// 4.对模块配置
app.use(session({
  secret:"128位随机字符串",//安全令牌
  resave:false,          //请求保存
  saveUninitialized:true,//初始化
  cookie:{         //sessionid保存时间1天 cookie
    maxAge:1000*60*60*24
  }
}))
//接收用户上传文件请求post
//upload接收用户上传请求
//upload.single一次上传一张图片
//file 上传图片参数名字 name="file"
app.post("/upload",upload.single("file"),(req,res)=>{
  //判断文件是否超过2MB 禁止上传
  console.log(req)
  var size= req.file.size/1024/1024;
  //console.log(size);
  if(size > 2){
    res.send({code:-1,msg:"上传图片过大，不能超过2MB"});
    return;
  }
  //8.判断文件类型必须是图片
  var type=req.file.mimetype;
  var i2 = type.indexOf("image");
  if(i2 == -1){
    res.send({code:-2,msg:"上传只能是图片"});
    return;
  }
  //创建新图片文件
  var src = req.file.originalname;
  //把查询的时间变成毫秒数
  var fTime = new Date().getTime();
  var fRand = Math.floor(Math.random()*9999);
  //如果上传文件取文件后缀
  var i3 = src.lastIndexOf(".");
  var suff = src.substring(i3,src.length);
  var des = "./public/img/user"+fTime+fRand+suff;
  var dre = des.slice(9);
  var dd=dre;
  //将临时文件移动到./public/img/user目录下
  fs.renameSync(req.file.path,des)
  res.send({code:1,msg:"图片上传成功",dd})

})

//轮播图
app.get("/getImages",(req,res)=>{
    var rows = [
      {id:1,img_url:"img/1.jpg"},
      {id:2,img_url:"img/2.jpg"},
      {id:3,img_url:"img/3.jpg"},
      {id:4,img_url:"img/4.jpg"}
    ];
    res.send(rows);
  });

  //登录
  app.get("/login",(req,res)=>{
    var name = req.query.name;
    var pwd = req.query.pwd;
    // 3:创建sql
    //console.log(name, pwd);
  var sql="SELECT count(id) as c,id FROM moli_login WHERE name = ?  AND pwd = md5(?)";
  // sql +=" FROM md_user";
  // sql +=" WHERE uname = ? AND upwd = md5(?)";
  // 4:如果要是参数匹配成功将用户id保存session对象
  pool.query(sql,[name,pwd],(err,result)=>{
  
    if(err)throw err;	
    var c = result[0].c;		
    if(c == 1){				
      req.session.uid = result[0].id;
      var lid=result[0].id;			
      res.send({code:1,msg:"登录成功",lid});
    }else{
      res.send({code:-1,msg:"用户名和密码错误"});
    }
  })
  });
 //1.用户注册
 app.get("/register",(req,res)=>{
  //1.参数
  var name = req.query.name;
  var pwd = req.query.pwd;
  var phone = req.query.phone;
  var uname = req.query.uname;
  var cm = req.query.cm;
  //2.sql
  pool.query("INSERT INTO `moli_login`(`id`, `name`, `uname`, `cm`, `pwd`, `phone`) VALUES (null,?,?,?,md5(?),?)",[name,uname,cm,pwd,phone],(err,result)=>{
    if(err) throw err;
    if(result.affectedRows>=1){
      res.send({code:1,msg:"注册成功"});
    }else{
      res.send({code:-1,msg:"注册失败"})
    }
  })
});
//2.用户名是否存在
app.get("/existsName",(req,res)=>{
  var name=req.query.name;
  pool.query("SELECT count(id) as c FROM `moli_login` WHERE name=?",[name],(err,result)=>{
    if(err) throw err;
    console.log(result[0].c)
    if(result[0].c==0){
      res.send({code:1})
    }else{
      res.send({code:-1})
    }
  }) 
});

//国风页
app.get("/tom",(req,res)=>{
  //1:参数       pno 页码;pageSize 页大小
  var pno = req.query.pno;
  var pageSize = req.query.pageSize;
  //1.2:默认值
  if(!pno){
    pno = 1;
  }
  if(!pageSize){
    pageSize = 2;
  }
  //2:验证正则表达式
  var reg = /^[0-9]{1,}$/;
  if(!reg.test(pno)){
     res.send({code:-1,msg:"页码格式不正确"});
     return;
  }
  if(!reg.test(pageSize)){
    res.send({code:-2,msg:"页大小格式不正确"});
    return;
  }
  //3:创建sql
  //  查询总页数
  var sql = "SELECT count(id) as c FROM moli_toms";
  var progress = 0; //sql执行进度
  obj = {code:1};
  pool.query(sql,(err,result)=>{
       if(err)throw err;
       var pageCount = Math.ceil(result[0].c/pageSize);
       obj.pageCount = pageCount;
       progress += 50;
       if(progress == 100){
        res.send(obj);
       }
  });
  //  查询当前页内容
var sql=" SELECT *";
    sql +=" FROM moli_toms";
    sql +=" ORDER BY id DESC"
    sql +=" LIMIT ?,?"
var offset = parseInt((pno-1)*pageSize);
pageSize = parseInt(pageSize);
  pool.query(sql,[offset,pageSize],(err,result)=>{
    if(err)throw err;
    obj.data = result;
    progress+=50;
    if(progress==100){
      res.send(obj);
    }
  }); 
})
//nba页面
  app.get("/nba",(req,res)=>{
    //1:参数       pno 页码;pageSize 页大小
    var pno = req.query.pno;
    var pageSize = req.query.pageSize;
    //1.2:默认值
    if(!pno){
      pno = 1;
    }
    if(!pageSize){
      pageSize = 2;
    }
    //2:验证正则表达式
    var reg = /^[0-9]{1,}$/;
    if(!reg.test(pno)){
       res.send({code:-1,msg:"页码格式不正确"});
       return;
    }
    if(!reg.test(pageSize)){
      res.send({code:-2,msg:"页大小格式不正确"});
      return;
    }
    //3:创建sql
    //  查询总页数
    var sql = "SELECT count(id) as c FROM moli_nba";
    var progress = 0; //sql执行进度
    obj = {code:1};
    pool.query(sql,(err,result)=>{
         if(err)throw err;
         //console.log(result[0].c);
         var pageCount = Math.ceil(result[0].c/pageSize);
         obj.pageCount = pageCount;
         progress += 50;
         if(progress == 100){
          res.send(obj);
         }
    });
    //  查询当前页内容
  var sql=" SELECT *";
      sql +=" FROM moli_nba";
      sql +=" ORDER BY id DESC"
      sql +=" LIMIT ?,?"
  var offset = parseInt((pno-1)*pageSize);
  pageSize = parseInt(pageSize);
    pool.query(sql,[offset,pageSize],(err,result)=>{
      if(err)throw err;
      obj.data = result;
      progress+=50;
      if(progress==100){
        res.send(obj);
      }
    }); 
  })
  //小视频
  app.get("/video",(req,res)=>{
    //1:参数       pno 页码;pageSize 页大小
    var pno = req.query.pno;
    var pageSize = req.query.pageSize;
    //1.2:默认值
    if(!pno){
      pno = 1;
    }
    if(!pageSize){
      pageSize = 2;
    }
    //2:验证正则表达式
    var reg = /^[0-9]{1,}$/;
    if(!reg.test(pno)){
       res.send({code:-1,msg:"页码格式不正确"});
       return;
    }
    if(!reg.test(pageSize)){
      res.send({code:-2,msg:"页大小格式不正确"});
      return;
    }
    //3:创建sql  查询总页数
    var sql = "SELECT count(id) as c FROM moli_video";
    var progress = 0; //sql执行进度
    obj = {code:1};
    pool.query(sql,(err,result)=>{
         if(err)throw err;
         var pageCount = Math.ceil(result[0].c/pageSize);
         obj.pageCount = pageCount;
         progress += 50;
         if(progress == 100){
          res.send(obj);
         }
    });
    //  查询当前页内容
  var sql=" SELECT *";
      sql +=" FROM moli_video";
      sql +=" ORDER BY id DESC"
      sql +=" LIMIT ?,?"
  var offset = parseInt((pno-1)*pageSize);
  pageSize = parseInt(pageSize);
    pool.query(sql,[offset,pageSize],(err,result)=>{
      if(err)throw err;
      obj.data = result;
      progress+=50;
      if(progress==100){
        res.send(obj);
      }
    }); 
  })
  
  //详情
  app.get("/details",(req,res)=>{
    var sql="SELECT * FROM `moli_details`";
    pool.query(sql,(err,result)=>{
        if(err)throw err;
        res.send(result)
    })
  })
//推荐页及分页
app.get("/com",(req,res)=>{
  //1:参数       pno 页码;pageSize 页大小
  var pno = req.query.pno;
  var pageSize = req.query.pageSize;
  //1.2:默认值
  if(!pno){
    pno = 1;
  }
  if(!pageSize){
    pageSize = 2;
  }
  //2:验证正则表达式
  var reg = /^[0-9]{1,}$/;
  if(!reg.test(pno)){
     res.send({code:-1,msg:"页码格式不正确"});
     return;
  }
  if(!reg.test(pageSize)){
    res.send({code:-2,msg:"页大小格式不正确"});
    return;
  }
  //3:创建sql
  //  查询总页数
  var sql = "SELECT count(id) as c FROM moli_tent";
  var progress = 0; //sql执行进度
  obj = {code:1};
  pool.query(sql,(err,result)=>{
       if(err)throw err;
       var pageCount = Math.ceil(result[0].c/pageSize);
       obj.pageCount = pageCount;
       progress += 50;
       if(progress == 100){
        res.send(obj);
       }
  });
  //  查询当前页内容
var sql=" SELECT *";
    sql +=" FROM moli_tent";
    sql +=" ORDER BY id DESC"
    sql +=" LIMIT ?,?"
var offset = parseInt((pno-1)*pageSize);
pageSize = parseInt(pageSize);
  pool.query(sql,[offset,pageSize],(err,result)=>{
    if(err)throw err;
    obj.data = result;
    progress+=50;
    if(progress==100){
      res.send(obj);
    }
  }); 
})

//跳转新闻详情
app.get("/add_com",(req,res)=>{
  var lid = req.query.lid;
  pool.query("SELECT * FROM `moli_details` WHERE lid=?",[lid],(err,result)=>{
    if(err)throw err;
    res.send(result);
  })
})
//评论区域
app.get("/tic",(req,res)=>{
  var lid = req.query.lid;
  var content = req.query.content;
  pool.query("INSERT INTO `moli_critic`(`id`, `lid`, `uname`, `title`, `ctime`) VALUES (null,?,1,?,now())",[lid,content],(err,result)=>{
    if(err) throw err;
    if(result.affectedRows>=1){
      res.send({code:1,msg:"评论成功"})
    }else{
      res.send({code:-1,msg:"评论失败"})
    }
  })
})
app.get("/cri",(req,res)=>{
  var lid = req.query.lid;
  pool.query("SELECT * FROM `moli_critic` WHERE lid=?",[lid],(err,result)=>{
    if(err) throw err;
    res.send(result);
  })
})
//我的主页页面切换
app.get("/hui",(req,res)=>{
  var session=req.session.uid ;
  if(session==undefined){
    res.send({code:-1})
  }else{
    res.send({code:1})
  }
})
//登陆后个人首页
app.get("/tepp",(req,res)=>{
  var pid=req.session.uid;
  pool.query("SELECT `id`, `name`, `uname`, `cm` FROM `moli_login` WHERE id=?",[pid],(err,result)=>{
    if(err) throw err;
    res.send(result);
  })
})
//退出登录
app.get("/quit",(req,res)=>{
  req.session.uid = null;

  res.send({code:1,msg:"退出成功"})

});
//搜索框
app.get("/sou",(req,res)=>{
  //获取文本框中的参数
  var kwords=req.query.kwords;
  // abc pp ii
  //将获取的参数切割，空格隔开
  var title=kwords.split(" ");
  //[abc,pp,ii]
  //map,创建新数组，拿回调函数执行，及格数值执行几次
  var arr=title.map(function(){
    return " title like ? ";
  })
  //[title like ?,title like ?,title like ?]
  //join将数组转为字符，可指定字符拼接
  var titles=arr.join(" and");
  //title like ?and title like ?and  title like ?
  title.forEach(function(val,i,arr){
    title[i]=`%${val}%`;
  });
  console.log(title,titles);
  //[%abc%,%pp%,%ii%] %${val}%
  pool.query("SELECT * FROM moli_details WHERE "+titles,title,(err,result)=>{
    if(err) throw err;
    //console.log(result);
    res.send(result)
  })
})